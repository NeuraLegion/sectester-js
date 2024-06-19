import { Protocol } from '../models';
import { URL } from 'url';

export interface RequestOptions {
  protocol: Protocol;
  url: string;
  headers?: Record<string, string | string[]>;
  method?: string;
  body?: string;
  encoding?: 'base64';
  maxContentSize?: number;
  timeout?: number;
  decompress?: boolean;
}

export class Request {
  public static readonly SINGLE_VALUE_HEADERS: ReadonlySet<string> =
    new Set<string>([
      'authorization',
      'content-disposition',
      'content-length',
      'content-type',
      'from',
      'host',
      'if-modified-since',
      'if-unmodified-since',
      'location',
      'max-forwards',
      'proxy-authorization',
      'referer',
      'user-agent'
    ]);

  public readonly protocol: Protocol;
  public readonly url: string;
  public readonly method: string;
  public readonly body?: string;
  public readonly encoding?: 'base64';
  public readonly maxContentSize?: number;
  public readonly decompress?: boolean;
  public readonly timeout?: number;

  private _headers: Record<string, string | string[]> = {};

  get headers(): Readonly<Record<string, string | string[]>> {
    return this._headers;
  }

  get secureEndpoint(): boolean {
    return this.url.startsWith('https');
  }

  constructor({
    protocol,
    method,
    url,
    body,
    timeout,
    maxContentSize,
    encoding,
    decompress = true,
    headers = {}
  }: RequestOptions) {
    this.protocol = protocol;
    this.method = method?.toUpperCase() ?? 'GET';

    this.validateUrl(url);
    this.url = url.trim();

    this.precheckBody(body);
    this.body = body;

    this.setHeaders(headers);

    this.encoding = encoding;
    this.timeout = timeout;
    this.maxContentSize = maxContentSize;
    this.decompress = !!decompress;
  }

  public setHeaders(headers: Record<string, string | string[]>): void {
    const mergedHeaders = {
      ...this._headers,
      ...headers
    };

    this._headers = Object.fromEntries(
      Object.entries(mergedHeaders).map(
        ([field, value]: [string, string | string[]]) => [
          field,
          Array.isArray(value) &&
          Request.SINGLE_VALUE_HEADERS.has(field.toLowerCase())
            ? value.join(', ')
            : value
        ]
      )
    );
  }

  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL.');
    }
  }

  private precheckBody(body: string | undefined): void {
    if (body && typeof body !== 'string') {
      throw new Error('Body must be string.');
    }
  }
}
