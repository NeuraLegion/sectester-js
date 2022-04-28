import { HttpMethod, isHttpMethod } from './HttpMethod';
import { escape } from './utils';
import { TargetOptions } from './TargetOptions';
import FormData from 'form-data';
import {
  Header,
  normalizeUrl,
  Param,
  PostData,
  QueryString,
  Request
} from '@har-sdk/core';
import { format } from 'url';

export class Target implements TargetOptions {
  private _parsedURL!: URL;
  private _serializeQuery?:
    | ((params: URLSearchParams | Record<string, string | string[]>) => string)
    | undefined;
  private _url?: string;

  get url(): string {
    if (!this._url) {
      this._url = format(this._parsedURL, {
        fragment: false
      });
    }

    return this._url;
  }

  private set url(value: string) {
    this._parsedURL = new URL(normalizeUrl(value));
    delete this._url;
    delete this._query;
    delete this._queryString;
    delete this._queryParameters;
  }

  private _method: HttpMethod | string;

  get method(): HttpMethod | string {
    return this._method;
  }

  private _queryString?: string;

  get queryString() {
    if (!this._queryString) {
      const params = this._query || this._parsedURL.search;

      this._queryString =
        typeof params !== 'string'
          ? this.serializeQuery(params)
          : params.replace(/^\?/, '');
    }

    return this._queryString;
  }

  private _queryParameters?: QueryString[];

  get queryParameters(): QueryString[] {
    if (!this._queryParameters) {
      this._queryParameters = this.parseUrlEncodedString(this.queryString);
    }

    return this._queryParameters ?? [];
  }

  private _query?: URLSearchParams | Record<string, string | string[]> | string;

  get query() {
    return this._query ?? '';
  }

  private set query(
    queryString: URLSearchParams | Record<string, string | string[]> | string
  ) {
    this._query = queryString;
    this._parsedURL.search = this.queryString;
  }

  private _headerValues = new Map<string, string | undefined>();

  private _headerParameters?: Header[];

  get headerParameters() {
    if (!this._headerParameters?.length) {
      this._headerParameters = this.convertToKeyValuePairs(
        Object.entries(this.headers)
      );
    }

    return this._headerParameters ?? [];
  }

  private _headers?: Record<string, string | string[]>;

  get headers() {
    return this._headers ?? {};
  }

  private set headers(headers: Record<string, string | string[]>) {
    this._headers = headers;
    this._headerValues.clear();
    delete this._headerParameters;
  }

  private _body: FormData | URLSearchParams | string | unknown;

  get body(): FormData | URLSearchParams | string | unknown {
    return this._body;
  }

  private set body(value: FormData | URLSearchParams | string | unknown) {
    this._body = value;
  }

  get contentType(): string {
    return this.getHeaderValue('content-type') ?? 'text/plain';
  }

  get httpVersion(): string {
    const version =
      this.getHeaderValue('version') || this.getHeaderValue(':version');

    if (version) {
      return version;
    }

    return 'HTTP/0.9';
  }

  constructor({
    url,
    body,
    query,
    headers = {},
    serializeQuery,
    method = HttpMethod.GET
  }: TargetOptions) {
    this.url = url;
    this._method = isHttpMethod(method) ? method : HttpMethod.GET;
    this.body = body;
    this.headers = headers;
    this._serializeQuery = serializeQuery;
    this.query = query ?? '';
  }

  public serializeQuery(
    params: URLSearchParams | Record<string, string | string[]>
  ): string {
    return (
      this._serializeQuery?.(params) ??
      (params instanceof URLSearchParams
        ? params
        : new URLSearchParams(params)
      ).toString()
    );
  }

  public toHarRequest(): Request {
    const postData =
      this.body !== null && this.body !== undefined
        ? this.postData()
        : undefined;

    return {
      postData,
      headers: [...this.headerParameters],
      method: this.method,
      url: this.url,
      httpVersion: this.httpVersion,
      queryString: [...this.queryParameters],
      cookies: [],
      headersSize: -1,
      bodySize: -1
    };
  }

  // eslint-disable-next-line complexity
  private postData(): PostData {
    if (
      this.body instanceof FormData ||
      (typeof this.body === 'string' &&
        /^multipart\/form-data\s*;\s*boundary\s*=\s*(\S+)\s*$/i.test(
          this.contentType
        ))
    ) {
      return this.formPostData(this.body);
    }

    if (
      this.body instanceof URLSearchParams ||
      (typeof this.body === 'string' &&
        /^application\/x-www-form-urlencoded\s*(;.*)?$/i.test(this.contentType))
    ) {
      return this.urlEncodedPostData(this.body);
    }

    if (
      Buffer.isBuffer(this.body) ||
      this.body instanceof Date ||
      typeof this.body === 'string' ||
      typeof this.body === 'boolean' ||
      typeof this.body === 'number'
    ) {
      const text = this.body.toString();

      return { text, mimeType: this.contentType };
    }

    if (
      (this.body !== null && typeof this.body === 'object') ||
      (typeof this.body === 'string' &&
        /^application\/json\s*(;.*)?$/i.test(this.contentType))
    ) {
      return this.jsonPostData(this.body);
    }

    return { text: '', mimeType: this.contentType };
  }

  private formPostData(body: FormData | string) {
    let text: string;

    if (typeof body === 'string') {
      text = body;
    } else {
      this.headers = { ...this._headers, ...body.getHeaders() };
      text = body.getBuffer().toString();
    }

    const [, boundary]: RegExpMatchArray =
      this.contentType.match(
        /^multipart\/form-data\s*;\s*boundary\s*=\s*(\S+)\s*$/
      ) ?? [];

    const params = boundary
      ? this.parseMultipartFormDataParameters(text, boundary)
      : [];

    return {
      text,
      params,
      mimeType: this.contentType
    } as unknown as PostData;
  }

  private parseMultipartFormDataParameters(
    data: string,
    boundary: string
  ): Param[] {
    const sanitizedBoundary = escape(boundary);
    const keyValuePattern = new RegExp(
      // Header with an optional file name.
      '^\\r\\ncontent-disposition\\s*:\\s*form-data\\s*;\\s*name="([^"]*)"(?:\\s*;\\s*filename="([^"]*)")?' +
        // Optional secondary header with the content type.
        '(?:\\r\\ncontent-type\\s*:\\s*([^\\r\\n]*))?' +
        // Padding.
        '\\r\\n\\r\\n' +
        // Value
        '(.*)' +
        // Padding.
        '\\r\\n$',
      'is'
    );
    const fields: string[] = data.split(
      // eslint-disable-next-line no-useless-escape
      new RegExp(`--${sanitizedBoundary}(?:--\s*$)?`, 'g')
    );

    return fields.reduce((result: Param[], field: string): Param[] => {
      const [match, name, fileName, contentType, value]: RegExpMatchArray =
        field.match(keyValuePattern) || [];

      if (!match) {
        return result;
      }

      result.push({ name, value, fileName, contentType });

      return result;
    }, []);
  }

  private urlEncodedPostData(body: URLSearchParams | string) {
    const text = body.toString();
    const params = this.parseUrlEncodedString(text);

    this.headers = {
      ...this._headers,
      'content-type': 'application/x-www-form-urlencoded'
    };

    return {
      text,
      params,
      mimeType: this.contentType
    } as unknown as PostData;
  }

  private jsonPostData(body: object | string): PostData {
    const text = typeof body === 'object' ? JSON.stringify(body) : body;

    this.headers = { ...this._headers, 'content-type': 'application/json' };

    return { text, mimeType: this.contentType };
  }

  private getHeaderValue(headerName: string): string | undefined {
    if (!this._headerValues.has(headerName)) {
      this._headerValues.set(headerName, this.computeHeaderValue(headerName));
    }

    return this._headerValues.get(headerName);
  }

  private parseUrlEncodedString(str: string) {
    return this.convertToKeyValuePairs([...new URLSearchParams(str)]);
  }

  private convertToKeyValuePairs(
    val: [string, string | string[]][]
  ): { name: string; value: string }[] {
    return val
      .map(([name, value]: [string, string | string[]]) =>
        Array.isArray(value)
          ? value.map(item => ({ name, value: item }))
          : { name, value }
      )
      .flat();
  }

  private computeHeaderValue(headerName: string): string | undefined {
    const normalizedName = headerName.toLowerCase();

    const values: string[] = this.headerParameters
      .filter(({ name }: Header) => name.toLowerCase() === normalizedName)
      .map(({ value }: Header) => value);

    if (!values.length) {
      return;
    }

    // Set-Cookie values should be separated by '\n', not comma, otherwise cookies could not be parsed.
    if (normalizedName === 'set-cookie') {
      return values.join('\n');
    }

    return values.join(', ');
  }
}
