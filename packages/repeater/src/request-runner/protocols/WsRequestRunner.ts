import { Request } from '../Request';
import { RequestRunner } from '../RequestRunner';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Response } from '../Response';
import { Protocol } from '../../models';
import { Logger } from '@secbox/core';
import WebSocket from 'ws';
import { inject, injectable } from 'tsyringe';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { once } from 'events';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { promisify } from 'util';

interface WSMessage {
  body: string | undefined;
  code?: number;
}

@injectable()
export class WsRequestRunner implements RequestRunner {
  public static readonly FORBIDDEN_HEADERS: ReadonlySet<string> = new Set([
    'sec-websocket-version',
    'sec-websocket-key'
  ]);

  private readonly agent?: SocksProxyAgent;

  constructor(
    @inject(RequestRunnerOptions)
    private readonly options: RequestRunnerOptions,
    @inject(Logger)
    private readonly logger?: Logger
  ) {
    this.agent = this.options.proxyUrl
      ? new SocksProxyAgent({
          ...parse(this.options.proxyUrl)
        })
      : undefined;
  }

  get protocol(): Protocol {
    return Protocol.WS;
  }

  public async run(options: Request): Promise<Response> {
    let timeout: NodeJS.Timeout | null = null;
    let client: WebSocket | null = null;

    try {
      this.logger?.debug(
        'Executing HTTP request with following params: %j',
        options
      );

      client = this.createWebSocketClient(options);

      const res: IncomingMessage = await this.connect(client);

      // @ts-expect-error TS infers a wrong type here
      await promisify(client.send.bind(client))(options.body);

      timeout = this.setTimeout(client);

      const msg = await this.consume(client, options.correlationIdRegex);

      return new Response({
        protocol: this.protocol,
        statusCode: msg?.code ?? res.statusCode,
        headers: res.headers,
        body: msg?.body
      });
    } catch (err) {
      return this.handleRequestError(err, options);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }

      if (client && client.readyState === WebSocket.OPEN) {
        client.close(1000);
      }
    }
  }

  private createWebSocketClient(options: Request) {
    return new WebSocket(options.url, {
      agent: this.agent,
      rejectUnauthorized: false,
      timeout: this.options.timeout,
      headers: this.normalizeHeaders(options.headers)
    });
  }

  private handleRequestError(err: any, options: Request) {
    const message = err.info ?? err.message;
    const errorCode = err.code ?? err.syscall;

    this.logger?.error('Error executing request: %s', options.url);
    this.logger?.error('Cause: %s', message);

    return new Response({
      message,
      errorCode,
      protocol: this.protocol
    });
  }

  private setTimeout(client: WebSocket): NodeJS.Timeout {
    const timeout = setTimeout(
      () =>
        client.emit(
          'error',
          Object.assign(new Error('Waiting frame has timed out'), {
            code: 'ETIMEDOUT'
          })
        ),
      this.options.timeout
    );

    timeout.unref();

    return timeout;
  }

  private async consume(
    client: WebSocket,
    matcher?: RegExp
  ): Promise<WSMessage | undefined> {
    const result = (await Promise.race([
      this.waitForResponse(client, matcher),
      once(client, 'close')
    ])) as [string | number, string | undefined];

    let msg: WSMessage | undefined;

    if (result.length) {
      const [data, reason]: [string | number, string | undefined] = result;
      const body = typeof data === 'string' ? data : reason;
      const code = typeof data === 'number' ? data : undefined;

      msg = {
        body,
        code
      };
    }

    return msg;
  }

  private waitForResponse(
    client: WebSocket,
    matcher: RegExp | undefined
  ): Promise<[string]> {
    return new Promise(resolve => {
      client.on('message', (data: WebSocket.Data) => {
        const dataString = String(data);
        !matcher || matcher.test(dataString)
          ? resolve([dataString])
          : undefined;
      });
    });
  }

  private async connect(client: WebSocket): Promise<IncomingMessage> {
    const opening = once(client, 'open');
    const upgrading = once(client, 'upgrade') as Promise<[IncomingMessage]>;

    await opening;

    const [res]: [IncomingMessage] = await upgrading;

    return res;
  }

  private normalizeHeaders(
    headers: Record<string, string | string[]>
  ): Record<string, string | string[]> {
    return Object.entries(headers).reduce(
      (
        result: Record<string, string | string[]>,
        [key, value]: [string, string | string[]]
      ) => {
        const headerName = key.trim().toLowerCase();
        if (!WsRequestRunner.FORBIDDEN_HEADERS.has(headerName)) {
          result[key] = value;
        }

        return result;
      },
      {}
    );
  }
}
