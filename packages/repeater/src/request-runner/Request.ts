import { Protocol } from '../models';
import { URL } from 'url';

export interface RequestOptions {
  protocol: Protocol;
  url: string;
  method?: string;
  headers?: Record<string, string | string[]>;
  body?: string;
  correlationIdRegex?: string | RegExp;
}

export class Request {
  public readonly protocol: Protocol;
  public readonly url: string;
  public readonly body?: string;
  public readonly correlationIdRegex?: RegExp;

  private readonly _method?: string;

  get method(): string | undefined {
    return this._method;
  }

  private _headers?: Record<string, string | string[]>;

  get headers(): Readonly<Record<string, string | string[]>> | undefined {
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
    correlationIdRegex,
    headers = {}
  }: RequestOptions) {
    this.protocol = protocol;
    this._method = method?.toUpperCase() ?? 'GET';
    this.validateUrl(url);
    this.url = url;
    this.correlationIdRegex =
      this.normalizeCorrelationIdRegex(correlationIdRegex);
    this._headers = headers;
    this.precheckBody(body);
    this.body = body;
  }

  public setHeaders(headers: Record<string, string | string[]>): void {
    this._headers = {
      ...this._headers,
      ...headers
    };
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
