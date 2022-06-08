import { Request } from '../Request';
import { RequestRunner } from '../RequestRunner';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Response } from '../Response';
import { Protocol } from '../../models';
import { Logger } from '@sectester/core';
import request from 'request-promise';
import { Response as IncomingResponse } from 'request';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { inject, injectable } from 'tsyringe';
import { parse as contentTypeParse } from 'content-type';
import { parse } from 'url';
import http, { OutgoingMessage } from 'http';
import https, { AgentOptions } from 'https';

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
        ...parse(this.options.proxyUrl)
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
        headers: response.headers,
        body: response.body
      });
    } catch (err) {
      return this.handleRequestError(err, options);
    }
  }

  private handleRequestError(err: any, options: Request): Response {
    if (err.response) {
      const { response } = err;

      return new Response({
        protocol: this.protocol,
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body
      });
    }

    const message = err.cause?.message ?? err.message;
    const errorCode = err.cause?.code ?? err.error?.syscall ?? err.name;

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
    let responseTruncatePromise: Promise<Buffer | undefined>;

    const res = await request({
      agent: this.getRequestAgent(options),
      body: options.body,
      followRedirect: false,
      gzip: true,
      method: options.method,
      resolveWithFullResponse: true,
      strictSSL: false,
      rejectUnauthorized: false,
      timeout: this.options.timeout,
      url: options.url
    })
      .on('request', (req: OutgoingMessage) => this.setHeaders(req, options))
      .on(
        'response',
        (response: IncomingResponse) =>
          (responseTruncatePromise = this.truncateResponse(response))
      );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const body = await responseTruncatePromise!;

    if (body) {
      res.body = body.toString();
      res.headers['content-length'] = String(body.byteLength);
    }

    return res;
  }

  private getRequestAgent(options: Request) {
    return (
      this.proxy ??
      (options.url.startsWith('https') ? this.httpsAgent : this.httpAgent)
    );
  }

  private async truncateResponse(
    res: IncomingResponse
  ): Promise<Buffer | undefined> {
    if (res.statusCode === 204 || res.method === 'HEAD') {
      return;
    }

    const type = this.parseContentType(res);
    const maxBodySize = this.maxContentLength * 1024;

    const requiresTruncating = !this.options.allowedMimes?.some(
      (mime: string) => type.startsWith(mime)
    );

    return this.parseBody(res, { maxBodySize, requiresTruncating });
  }

  private parseContentType(res: IncomingResponse): string {
    let type = res.headers['content-type'] || 'text/plain';

    try {
      ({ type } = contentTypeParse(type));
    } catch {
      // noop
    }

    return type;
  }

  private async parseBody(
    res: IncomingResponse,
    options: { maxBodySize: number; requiresTruncating: boolean }
  ): Promise<Buffer> {
    let truncated = false;

    const chunks = [];
    let chunksByteLength = 0;

    for await (const chunk of res) {
      chunks.push(chunk);

      chunksByteLength += Buffer.from(chunk).byteLength;
      truncated =
        this.maxContentLength !== -1 &&
        chunksByteLength > options.maxBodySize &&
        options.requiresTruncating;

      if (truncated) {
        res.destroy();
        break;
      }
    }

    const body = Buffer.concat(chunks);

    if (truncated) {
      this.logger.debug(
        'Truncate original response body to %i bytes',
        options.maxBodySize
      );

      return body.slice(0, options.maxBodySize);
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
