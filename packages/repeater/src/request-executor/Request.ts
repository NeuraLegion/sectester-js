import { URL } from 'url';

export interface RequestOptions {
  method?: string;
  url: string;
  headers: Record<string, string | string[]>;
  body?: string;
  correlationIdRegex?: string | RegExp;
}

export class Request {
  public readonly url: string;
  public readonly body?: string;
  public readonly correlationIdRegex?: RegExp;

  private readonly _method?: string;

  get method(): string | undefined {
    return this._method;
  }

  private _headers: Record<string, string | string[]>;

  get headers(): Record<string, string | string[]> {
    return this._headers;
  }

  constructor({
    method,
    url,
    body,
    correlationIdRegex,
    headers = {}
  }: RequestOptions) {
    this._method = method?.toUpperCase() ?? 'GET';

    if (!url) {
      throw new Error('Url must be declared explicitly.');
    }

    try {
      this.url = new URL(url).toString();
    } catch {
      throw new Error('Invalid URL.');
    }

    if (body && typeof body !== 'string') {
      throw new Error('Body must be string.');
    }

    this.body = body;

    if (correlationIdRegex) {
      try {
        this.correlationIdRegex = new RegExp(correlationIdRegex, 'i');
      } catch {
        // noop
      }
    }

    this._headers = headers;
  }

  public setHeaders(headers: Record<string, string | string[]>): void {
    this._headers = {
      ...this._headers,
      ...(headers ?? {})
    };
  }
}
