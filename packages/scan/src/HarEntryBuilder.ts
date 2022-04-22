import { Header } from './Scans';
import FormData from 'form-data';

export interface Entry {
  startedDateTime: string;
  time: number;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  cache: Record<string, unknown>;
  timings: Record<string, unknown>;
}

export interface Har {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    entries: Entry[];
  };
}

export class HarEntryBuilder {
  private url: string;
  private body?: string;
  private query?: string;
  private headers: Header[] = [];
  private method: string = 'GET';

  constructor(url: string, method?: string) {
    if (!url) {
      throw new Error('Please provide `url`.');
    }
    this.url = url;

    if (typeof method === 'string') {
      this.method = method;
    }
  }

  public postData(body: FormData | URLSearchParams | string | unknown): this {
    if (body) {
      if (typeof body === 'string') {
        this.body = body;
      } else if (body instanceof FormData) {
        this.setHeaders(body.getHeaders());
        this.body = JSON.stringify(body);
      } else if (body instanceof URLSearchParams) {
        this.body = body.toString();
      } else {
        this.body = JSON.stringify(body);
      }
    }

    return this;
  }

  public setQuery(
    query:
      | string
      | URLSearchParams
      | Record<string, string>
      | [string, string][]
      | undefined
  ): this {
    this.query = new URLSearchParams(query).toString();

    return this;
  }

  public setHeaders(headers: Record<string, string> | undefined): this {
    if (headers) {
      this.headers.push(
        ...Object.entries(headers).map(([key, value]: [string, string]) => ({
          name: key,
          value
        }))
      );
    }

    return this;
  }

  public build(): Entry {
    let url = this.url;

    if (this.query) {
      url += `?${this.query}`;
    }

    return {
      startedDateTime: new Date().toISOString(),
      request: {
        url,
        httpVersion: 'HTTP/1.1',
        method: this.method,
        headers: this.headers,
        body: this.body,
        headersSize: -1,
        bodySize: -1,
        cookies: [],
        queryString: []
      },
      response: {
        httpVersion: 'HTTP/1.1',
        status: 200,
        statusText: 'Ok',
        headersSize: -1,
        bodySize: -1,
        content: '',
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
}
