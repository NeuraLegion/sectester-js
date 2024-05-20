import { Protocol } from '../models';
import { URL } from 'url';

export interface RequestOptions {
  protocol: Protocol;
  url: string;
  headers?: Record<string, string | string[]>;
  method?: string;
  body?: string;
  correlationIdRegex?: string | RegExp;
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
  public readonly body?: string;
  public readonly correlationIdRegex?: RegExp;
  public readonly encoding?: 'base64';
  public readonly maxContentSize?: number;
  public readonly decompress?: boolean;
  public readonly timeout?: number;

  private _method: string;

  get method(): string {
    return this._method;
  }

  private _headers: Record<string, string | string[]> = {};

  get headers(): Readonly<Record<string, string | string[]>> {
    return this._headers;
  }

  private _ca?: Buffer;

  get ca() {
    return this._ca;
  }

  private _pfx?: Buffer;

  get pfx() {
    return this._pfx;
  }

  private _passphrase?: string;

  get passphrase() {
    return this._passphrase;
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
    correlationIdRegex,
    maxContentSize,
    encoding,
    decompress = true,
    headers = {}
  }: RequestOptions) {
    this.protocol = protocol;
    this._method = method?.toUpperCase() ?? 'GET';

    this.validateUrl(url);
    this.url = url.trim();

    this.precheckBody(body);
    this.body = body;

    this.correlationIdRegex =
      this.normalizeCorrelationIdRegex(correlationIdRegex);

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

    this._headers = Object.entries(mergedHeaders).reduce(
      (result, [field, value]: [string, string | string[]]) => {
        result[field] =
          Array.isArray(value) &&
          Request.SINGLE_VALUE_HEADERS.has(field.toLowerCase())
            ? value.join(', ')
            : value;

        return result;
      },
      {}
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

  private normalizeCorrelationIdRegex(
    correlationIdRegex: RegExp | string | undefined
  ): RegExp | undefined {
    if (correlationIdRegex) {
      try {
        return new RegExp(correlationIdRegex, 'i');
      } catch {
        throw new Error('Correlation id must be regular expression.');
      }
    }
  }
}
