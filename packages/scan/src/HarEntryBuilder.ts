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
  private readonly SCHEMA_REGEXP = /^.+:\/\//;
  private readonly CLUSTER_NORMALIZATION_REGEXP = /^(?!(?:\w+:)?\/\/)|^\/\//;
  private readonly AVALIABLES_METHODS = [
    'GET',
    'DELETE',
    'HEAD',
    'OPTIONS',
    'POST',
    'PUT',
    'PATCH',
    'PURGE',
    'LINK',
    'UNLINK'
  ];

  private url!: string;
  private body?: string;
  private query?: string;
  private method: string = 'GET';
  private headers: { name: string; value: unknown }[] = [];

  constructor(url: string, method: string = 'GET') {
    this.resolveUrls(url);

    if (this.AVALIABLES_METHODS.includes(method?.toUpperCase())) {
      this.method = method.toUpperCase();
    }
  }

  public postData(body: FormData | URLSearchParams | string | unknown): this {
    if (body) {
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

  public setHeaders(headers: Record<string, unknown>): this {
    if (headers) {
      this.headers.push(
        ...Object.entries(headers).map(([name, value]: [string, unknown]) => ({
          name,
          value
        }))
      );
    }

    return this;
  }

  public build(): Entry {
    let url = this.url;
    const queryString: Record<string, unknown>[] = [];
    const separator = url.includes('?') ? '&' : '?';

    if (this.query) {
      url += `${separator}${this.query}`;
      for (const [name, value] of new URLSearchParams(this.query).entries()) {
        queryString.push({ name, value });
      }
    }

    return {
      startedDateTime: new Date().toISOString(),
      request: {
        url,
        httpVersion: 'HTTP/1.1',
        method: this.method,
        headers: this.headers.slice(),
        postData: this.body,
        headersSize: Buffer.from(JSON.stringify(this.headers)).byteLength,
        bodySize: this.body ? Buffer.from(this.body).byteLength : -1,
        cookies: [],
        queryString
      },
      response: {
        httpVersion: 'HTTP/1.1',
        status: 200,
        statusText: 'OK',
        headersSize: -1,
        bodySize: -1,
        content: {},
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

  private resolveUrls(url: string): void {
    if (!this.SCHEMA_REGEXP.test(url)) {
      url = url.replace(this.CLUSTER_NORMALIZATION_REGEXP, 'https://');
    }

    try {
      const { hostname, protocol, search } = new URL(url);
      this.url = `${protocol}//${hostname}`;

      if (search) {
        this.setQuery(search.slice(1));
      }
    } catch {
      throw new Error(`Please make sure that you pass correct 'url' option.`);
    }
  }
}
