import { RequestRunner } from '../RequestRunner';
import { Response } from '../Response';
import { Request } from '../Request';
import { Protocol } from '../../models';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { ProxyFactory, NormalizeZlibDeflateTransformStream } from '../../utils';
import { Logger } from '@sectester/core';
import { inject, injectable } from 'tsyringe';
import iconv from 'iconv-lite';
import { safeParse } from 'fast-content-type-parse';
import { parse as parseUrl } from 'node:url';
import http, {
  ClientRequest,
  IncomingMessage,
  OutgoingMessage
} from 'node:http';
import https, {
  AgentOptions,
  RequestOptions as ClientRequestOptions
} from 'node:https';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import {
  constants,
  createBrotliDecompress,
  createGunzip,
  createInflate
} from 'node:zlib';
import { IncomingHttpHeaders } from 'http';

@injectable()
export class HttpRequestRunner implements RequestRunner {
  private readonly httpProxyAgent?: http.Agent;
  private readonly httpsProxyAgent?: https.Agent;
  private readonly httpAgent?: http.Agent;
  private readonly httpsAgent?: https.Agent;

  get protocol(): Protocol {
    return Protocol.HTTP;
  }

  constructor(
    private readonly logger: Logger,
    @inject(ProxyFactory) private readonly proxyFactory: ProxyFactory,
    @inject(RequestRunnerOptions)
    private readonly options: RequestRunnerOptions
  ) {
    if (this.options.proxyUrl) {
      ({ httpsAgent: this.httpsProxyAgent, httpAgent: this.httpProxyAgent } =
        this.proxyFactory.createProxy({ proxyUrl: this.options.proxyUrl }));
    }

    if (this.options.reuseConnection) {
      const agentOptions: AgentOptions = {
        keepAlive: true,
        maxSockets: 100,
        timeout: this.options.timeout
      };

      this.httpsAgent = new https.Agent(agentOptions);
      this.httpAgent = new http.Agent(agentOptions);
    }
  }

  public async run(options: Request): Promise<Response> {
    try {
      if (this.options.headers) {
        options.setHeaders(this.options.headers);
      }

      this.logger.debug(
        'Executing HTTP request with following params: %j',
        options
      );

      const { res, body } = await this.request(options);

      return new Response({
        body,
        protocol: this.protocol,
        statusCode: res.statusCode,
        headers: this.convertHeaders(res.headers),
        encoding: options.encoding
      });
    } catch (err) {
      const { cause } = err;
      const { message, code, syscall, name } = cause ?? err;
      const errorCode = code ?? syscall ?? name;

      this.logger.error(
        'Error executing request: "%s %s HTTP/1.1"',
        options.method,
        options.url
      );
      this.logger.error('Cause: %s', message);

      return new Response({
        message,
        errorCode,
        protocol: this.protocol
      });
    }
  }

  private convertHeaders(
    headers: IncomingHttpHeaders
  ): Record<string, string | string[]> {
    return Object.fromEntries(
      Object.entries(headers).map(
        ([name, value]: [string, string | string[] | undefined]) => [
          name,
          value ?? ''
        ]
      )
    );
  }

  private async request(options: Request) {
    let timer: NodeJS.Timeout | undefined;
    let res!: IncomingMessage;

    try {
      const req = this.createRequest(options);

      process.nextTick(() =>
        req.end(
          options.encoding && options.body
            ? iconv.encode(options.body, options.encoding)
            : options.body
        )
      );
      timer = this.setTimeout(req, options.timeout);

      [res] = (await once(req, 'response')) as [IncomingMessage];
    } finally {
      clearTimeout(timer);
    }

    return this.truncateResponse(options, res);
  }

  private createRequest(request: Request): ClientRequest {
    const protocol = request.secureEndpoint ? https : http;
    const outgoingMessage = protocol.request(
      this.createRequestOptions(request)
    );
    this.setHeaders(outgoingMessage, request);

    if (!outgoingMessage.hasHeader('accept-encoding')) {
      outgoingMessage.setHeader('accept-encoding', 'gzip, deflate');
    }

    return outgoingMessage;
  }

  private setTimeout(
    req: ClientRequest,
    timeout?: number
  ): NodeJS.Timeout | undefined {
    timeout ??= this.options.timeout;
    if (typeof timeout === 'number') {
      return setTimeout(
        () => req.destroy(new Error('Waiting response has timed out')),
        timeout
      );
    }
  }

  private createRequestOptions(request: Request): ClientRequestOptions {
    const {
      auth,
      hostname,
      port,
      hash = '',
      pathname = '/',
      search = ''
    } = parseUrl(request.url);
    const path = `${pathname ?? '/'}${search ?? ''}${hash ?? ''}`;
    const agent = this.getRequestAgent(request);
    const timeout = request.timeout ?? this.options.timeout;

    return {
      hostname,
      port,
      path,
      auth,
      agent,
      timeout,
      method: request.method,
      rejectUnauthorized: false
    };
  }

  private getRequestAgent(options: Request) {
    return options.secureEndpoint
      ? this.httpsProxyAgent ?? this.httpsAgent
      : this.httpProxyAgent ?? this.httpAgent;
  }

  private async truncateResponse(
    { decompress, encoding, maxContentSize }: Request,
    res: IncomingMessage
  ) {
    if (this.responseHasNoBody(res)) {
      this.logger.debug('The response does not contain any body.');

      return { res, body: '' };
    }

    const contentType = this.parseContentType(res);
    const { type } = contentType;

    const requiresTruncating =
      this.options.maxContentLength !== -1 &&
      !this.options.allowedMimes?.some((mime: string) => type.startsWith(mime));

    const maxBodySize =
      typeof maxContentSize === 'number'
        ? maxContentSize * 1024
        : this.options.maxContentLength
        ? Math.abs(this.options.maxContentLength) * 1024
        : undefined;

    const body = await this.parseBody(res, {
      decompress,
      maxBodySize: requiresTruncating ? maxBodySize : undefined
    });

    res.headers['content-length'] = body.byteLength.toFixed();

    if (decompress) {
      delete res.headers['content-encoding'];
    }

    return { res, body: iconv.decode(body, encoding ?? contentType.encoding) };
  }

  private parseContentType(res: IncomingMessage): {
    type: string;
    encoding: string;
  } {
    const contentType =
      res.headers['content-type'] || 'application/octet-stream';
    const {
      type,
      parameters: { charset }
    } = safeParse(contentType);

    let encoding: string | undefined = charset;

    if (!encoding || !iconv.encodingExists(encoding)) {
      encoding = 'utf-8';
    }

    return { type, encoding };
  }

  private unzipBody(response: IncomingMessage): Readable {
    let body: Readable = response;

    if (!this.responseHasNoBody(response)) {
      let contentEncoding = response.headers['content-encoding'] || 'identity';
      contentEncoding = contentEncoding.trim().toLowerCase();

      // Always using Z_SYNC_FLUSH is what cURL does.
      const zlibOptions = {
        flush: constants.Z_SYNC_FLUSH,
        finishFlush: constants.Z_SYNC_FLUSH
      };

      switch (contentEncoding) {
        case 'gzip':
          body = response.pipe(createGunzip(zlibOptions));
          break;
        case 'deflate':
          body = response
            .pipe(new NormalizeZlibDeflateTransformStream())
            .pipe(createInflate(zlibOptions));
          break;
        case 'br':
          body = response.pipe(createBrotliDecompress());
          break;
      }
    }

    return body;
  }

  private responseHasNoBody(response: IncomingMessage): boolean {
    return (
      response.method === 'HEAD' ||
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (response.statusCode! >= 100 && response.statusCode! < 200) ||
      response.statusCode === 204 ||
      response.statusCode === 304
    );
  }

  private async parseBody(
    res: IncomingMessage,
    options: {
      maxBodySize?: number;
      decompress?: boolean;
    }
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const stream = options.decompress ? this.unzipBody(res) : res;

    for await (const chuck of stream) {
      chunks.push(chuck);
    }

    let body = Buffer.concat(chunks);

    const truncated =
      typeof options.maxBodySize === 'number' &&
      body.byteLength > options.maxBodySize;

    if (truncated) {
      this.logger.debug(
        'Truncate original response body to %i bytes',
        options.maxBodySize
      );

      body = body.subarray(0, options.maxBodySize);
    }

    return body;
  }

  /**
   * Allows to attack headers. Node.js does not accept any other characters
   * which violate [rfc7230](https://tools.ietf.org/html/rfc7230#section-3.2.6).
   * To override default behavior bypassing {@link OutgoingMessage.setHeader} method we have to set headers via internal symbol.
   */
  private setHeaders(req: OutgoingMessage, options: Request): void {
    const symbols: symbol[] = Object.getOwnPropertySymbols(req);
    const headersSymbol: symbol | undefined = symbols.find(
      // ADHOC: Node.js version < 12 uses "outHeadersKey" symbol to set headers
      item =>
        ['Symbol(kOutHeaders)', 'Symbol(outHeadersKey)'].includes(
          item.toString()
        )
    );

    if (!req.headersSent && headersSymbol && options.headers) {
      const headers = (req[headersSymbol] =
        req[headersSymbol] ?? Object.create(null));

      Object.entries(options.headers).forEach(
        ([key, value]: [string, string | string[]]) => {
          if (key) {
            headers[key.toLowerCase()] = [key.toLowerCase(), value ?? ''];
          }
        }
      );
    }
  }
}
