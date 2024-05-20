import { RequestRunner } from '../RequestRunner';
import { Protocol } from '../../models';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Request } from '../Request';
import { Response } from '../Response';
import { parse as parseMimetype } from 'content-type';
import { Logger } from '@sectester/core';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { inject, injectable } from 'tsyringe';
import { parse as parseUrl } from 'url';
import { once } from 'events';
import https, { RequestOptions } from 'https';
import http, {
  AgentOptions,
  ClientRequest,
  IncomingMessage,
  OutgoingMessage
} from 'http';
import {
  constants,
  createBrotliDecompress,
  createGunzip,
  createInflate
} from 'zlib';
import { Readable } from 'stream';

type IncomingResponse = IncomingMessage & { body?: string };

@injectable()
export class HttpRequestRunner implements RequestRunner {
  private readonly proxy?: SocksProxyAgent;
  private readonly httpAgent?: http.Agent;
  private readonly httpsAgent?: https.Agent;
  private readonly maxContentLength: number;

  get protocol(): Protocol {
    return Protocol.HTTP;
  }

  constructor(
    @inject(RequestRunnerOptions)
    private readonly options: RequestRunnerOptions,
    private readonly logger: Logger
  ) {
    if (this.options.proxyUrl) {
      this.proxy = new SocksProxyAgent({
        ...parseUrl(this.options.proxyUrl)
      });
    }

    this.maxContentLength =
      typeof this.options.maxContentLength === 'number'
        ? this.options.maxContentLength
        : -1;

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

      const response = await this.request(options);

      return new Response({
        protocol: this.protocol,
        statusCode: response.statusCode,
        headers: (response.headers ?? {}) as unknown as Record<
          string,
          string | string[]
        >,
        body: response.body
      });
    } catch (err) {
      return this.handleRequestError(err, options);
    }
  }

  private handleRequestError(err: any, options: Request): Response {
    const { cause } = err;
    const { message, code, syscall, name } = cause ?? err;
    let errorCode = code ?? syscall ?? name;

    if (typeof errorCode !== 'string') {
      errorCode = Error.name;
    }

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

  private async request(options: Request): Promise<IncomingResponse> {
    const ac = new AbortController();
    const { signal } = ac;
    let timer: NodeJS.Timeout | undefined;
    let res!: IncomingMessage;

    try {
      const req = this.createRequest(options, { signal });

      timer = this.setTimeout(ac);
      process.nextTick(() => req.end(options.body));

      [res] = (await once(req, 'response', {
        signal
      })) as [IncomingMessage];
    } finally {
      clearTimeout(timer);
    }

    return this.truncateResponse(res);
  }

  private createRequest(
    request: Request,
    options?: { signal?: AbortSignal }
  ): ClientRequest {
    const protocol = request.secureEndpoint ? https : http;
    const outgoingMessage = protocol.request(
      this.createRequestOptions(request, options)
    );
    this.setHeaders(outgoingMessage, request);

    if (!outgoingMessage.hasHeader('accept-encoding')) {
      outgoingMessage.setHeader('accept-encoding', 'gzip, deflate');
    }

    return outgoingMessage;
  }

  private setTimeout(ac: AbortController): NodeJS.Timeout | undefined {
    if (typeof this.options.timeout === 'number') {
      return setTimeout(
        () => ac.abort(/*'Waiting response has timed out'*/),
        this.options.timeout
      );
    }
  }

  private createRequestOptions(
    request: Request,
    options?: { signal?: AbortSignal }
  ): RequestOptions {
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

    return {
      ...options,
      hostname,
      port,
      path,
      auth,
      agent,
      method: request.method,
      timeout: this.options.timeout,
      rejectUnauthorized: false
    };
  }

  private getRequestAgent(options: Request) {
    return (
      this.proxy ?? (options.secureEndpoint ? this.httpsAgent : this.httpAgent)
    );
  }

  private async truncateResponse(
    res: IncomingResponse
  ): Promise<IncomingResponse> {
    if (this.responseHasNoBody(res)) {
      this.logger.debug('The response does not contain any body.');

      res.body = '';

      return res;
    }

    const type = this.parseContentType(res);
    const maxBodySize = this.maxContentLength * 1024;
    const requiresTruncating = !this.options.allowedMimes?.some(
      (mime: string) => type.startsWith(mime)
    );

    const body = await this.parseBody(res, { maxBodySize, requiresTruncating });

    res.body = body.toString();
    res.headers['content-length'] = String(body.byteLength);

    return res;
  }

  private parseContentType(res: IncomingMessage): string {
    let type = res.headers['content-type'] || 'text/plain';

    try {
      ({ type } = parseMimetype(type));
    } catch {
      // noop
    }

    return type;
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
          body = response.pipe(createInflate(zlibOptions));
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
    options: { maxBodySize: number; requiresTruncating: boolean }
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chuck of this.unzipBody(res)) {
      chunks.push(chuck);
    }

    let body = Buffer.concat(chunks);

    const truncated =
      this.maxContentLength !== -1 &&
      body.byteLength > options.maxBodySize &&
      options.requiresTruncating;

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
