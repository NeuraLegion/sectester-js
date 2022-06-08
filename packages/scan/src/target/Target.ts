import { HttpMethod, isHttpMethod } from '../models';
import { entriesToList } from '../utils';
import { BodyParser } from './body-parsers';
import {
  Header,
  normalizeUrl,
  PostData,
  QueryString,
  Request
} from '@har-sdk/core';
import { isPresent, isString } from '@sectester/core';
import { container } from 'tsyringe';
import { format } from 'url';

export interface TargetOptions {
  // The server URL that will be used for the request
  url: string;
  // The query parameters to be sent with the request
  query?: URLSearchParams | Record<string, string | string[]> | string;
  // The data to be sent as the request body.
  // The only required for POST, PUT, PATCH, and DELETE
  body?: unknown;
  // The request method to be used when making the request, GET by default
  method?: HttpMethod | string;
  // The headers
  headers?: Record<string, string | string[]>;
  // The optional method of serializing `query`
  // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
  serializeQuery?(
    params: URLSearchParams | Record<string, string | string[]>
  ): string;
}

export class Target implements TargetOptions {
  private _serializeQuery: (
    params: URLSearchParams | Record<string, string | string[]>
  ) => string;

  get serializeQuery() {
    return this._serializeQuery;
  }

  private _parsedURL!: URL;

  get parsedURL(): URL {
    return this._parsedURL;
  }

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

  private _method!: HttpMethod;

  get method(): HttpMethod {
    return this._method;
  }

  set method(value: HttpMethod) {
    this._method = value;
  }

  private _queryString?: string;

  get queryString() {
    if (!this._queryString) {
      const params = this._query || this._parsedURL.search;

      this._queryString = !isString(params)
        ? this.serializeQuery(params)
        : params.replace(/^\?/, '');
    }

    return this._queryString;
  }

  private _queryParameters?: QueryString[];

  get queryParameters(): QueryString[] {
    if (!this._queryParameters) {
      this._queryParameters = entriesToList(
        new URLSearchParams(this.queryString)
      );
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
      this._headerParameters = entriesToList(Object.entries(this.headers));
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

  private _postData: PostData | undefined;

  get postData(): PostData | undefined {
    if (!this._postData && isPresent(this.body)) {
      const parsedBody = container
        .resolveAll<BodyParser>(BodyParser)
        .find(x => x.canParse(this))
        ?.parse(this);

      if (parsedBody) {
        this.setContentTypeIfUnset(parsedBody.contentType);

        this._postData = {
          text: parsedBody.text,
          params: parsedBody.params,
          mimeType: parsedBody.contentType
        } as PostData;
      }
    }

    return this._postData;
  }

  private _body?: unknown;

  get body(): unknown {
    return this._body;
  }

  private set body(value: unknown) {
    this._body = value;
    delete this._postData;
  }

  get contentType(): string | undefined {
    return this.getHeaderValue('content-type');
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
    this.method = isHttpMethod(method) ? method : HttpMethod.GET;
    this.body = body;
    this.headers = headers;
    this._serializeQuery =
      serializeQuery ??
      ((params: URLSearchParams | string | Record<string, string | string[]>) =>
        new URLSearchParams(params).toString());
    this.query = query ?? '';
  }

  public toHarRequest(): Request {
    return {
      postData: this.postData,
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

  private setContentTypeIfUnset(contentType: string): void {
    if (!this.contentType) {
      this.headers = {
        ...this.headers,
        'content-type': contentType
      };
    }
  }

  private getHeaderValue(headerName: string): string | undefined {
    if (!this._headerValues.has(headerName)) {
      this._headerValues.set(headerName, this.computeHeaderValue(headerName));
    }

    return this._headerValues.get(headerName);
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
