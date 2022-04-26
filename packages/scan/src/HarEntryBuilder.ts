import { HttpMethod, isHttpMethod } from './models';
import FormData from 'form-data';
import {
  Entry,
  normalizeUrl,
  Request,
  Header,
  QueryString
} from '@har-sdk/core';

export class HarEntryBuilder {
  private url!: string;
  private body?: string;
  private query?: string;
  private method: HttpMethod;
  private headers: Header[] = [];

  constructor(url: string, method: HttpMethod | string = HttpMethod.GET) {
    this.url = normalizeUrl(url);
    this.method = isHttpMethod(method)
      ? (method.toUpperCase() as HttpMethod)
      : HttpMethod.GET;
    const u = new URL(this.url);
    this.setQuery(u.search.slice(1));
  }

  public postData(body: FormData | URLSearchParams | string | unknown): this {
    if (body) {
      this.parseBody(body);
    }

    return this;
  }

  public setQuery(
    query: URLSearchParams | Record<string, string> | string
  ): this {
    const queryToAdd = new URLSearchParams(query).toString();
    if (this.query) {
      this.query += `&${queryToAdd}`;
    } else {
      this.query = queryToAdd;
    }

    return this;
  }

  public setHeaders(headers: Record<string, string>): this {
    if (headers) {
      this.headers.push(
        ...Object.entries(headers).map(([name, value]: [string, string]) => ({
          name,
          value
        }))
      );
    }

    return this;
  }

  public build(): Entry {
    return {
      startedDateTime: new Date().toISOString(),
      request: this.buildRequest(),
      response: {
        httpVersion: 'HTTP/1.1',
        status: 200,
        statusText: 'OK',
        headersSize: -1,
        bodySize: -1,
        content: {
          size: -1,
          mimeType: 'text/plain'
        },
        redirectURL: '',
        cookies: [],
        headers: []
      },
      cache: {},
      time: 0,
      timings: {
        send: 0,
        receive: 0,
        wait: 0
      }
    };
  }

  private parseBody(body: FormData | URLSearchParams | string | unknown): void {
    if (typeof body === 'string') {
      this.body = body;
    } else if (body instanceof FormData) {
      this.setHeaders(body.getHeaders());
      this.body = body.getBuffer().toString();
    } else if (body instanceof URLSearchParams) {
      this.body = body.toString();
    } else {
      this.body = JSON.stringify(body);
    }
  }

  private buildRequest(): Request {
    return {
      url: this.serializeUrl(),
      httpVersion: 'HTTP/1.1',
      method: this.method,
      headers: this.headers.slice(),
      postData: this.body
        ? {
            text: this.body,
            mimeType:
              this.headers.find(({ name }) => name === 'content-type')?.value ||
              'text/plain'
          }
        : undefined,
      headersSize: Buffer.from(JSON.stringify(this.headers)).byteLength,
      bodySize: this.body ? Buffer.from(this.body).byteLength : -1,
      cookies: [],
      queryString: this.getQueryString()
    };
  }

  private serializeUrl(): string {
    let url = this.url;
    const separator = url.includes('?') ? '&' : '?';

    if (this.query) {
      url += `${separator}${this.query}`;
    }

    return url;
  }

  private getQueryString(): QueryString[] {
    const queryString: QueryString[] = [];

    if (this.query) {
      for (const [name, value] of new URLSearchParams(this.query).entries()) {
        queryString.push({ name, value });
      }
    }

    return queryString;
  }
}
