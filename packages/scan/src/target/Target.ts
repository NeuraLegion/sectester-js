import { HttpMethod, isHttpMethod } from '../models';
import { Body, BodyType } from './Body';
import { HeadersType } from './HeadersType';
import { QueryParamsType } from './QueryParamsType';
import { normalizeUrl } from '@har-sdk/core';
import { MIMEType } from 'util';

export interface TargetOptions {
  // The server URL that will be used for the request
  url: string;
  // The query parameters to be sent with the request
  query?: QueryParamsType;
  // The data to be sent as the request body.
  // The only required for POST, PUT, PATCH, and DELETE
  body?: BodyType;
  // The request method to be used when making the request, GET by default
  method?: HttpMethod | string;
  // The headers
  headers?: HeadersType;
  // The optional method of serializing `query`
  // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
  serializeQuery?(params: QueryParamsType): string;
}

export class Target implements TargetOptions {
  private _parsedURL!: URL;

  get parsedURL(): URL {
    return this._parsedURL;
  }

  private _cachedUrl?: string;

  get url(): string {
    if (!this._cachedUrl) {
      this._cachedUrl = this._parsedURL.toString();
    }

    return this._cachedUrl;
  }

  private set url(value: string) {
    this._parsedURL = new URL(normalizeUrl(value));
    this._cachedUrl = undefined;
    this._query = undefined;
    this._queryString = undefined;
  }

  private _method!: HttpMethod;

  get method(): HttpMethod {
    return this._method;
  }

  private set method(value: HttpMethod) {
    this._method = value;
  }

  private _queryString?: string;
  private _query?: QueryParamsType;

  get queryString(): string {
    if (!this._queryString) {
      const params = this._query || this._parsedURL.search;
      this._queryString =
        typeof params !== 'string'
          ? this.serializeQuery(params)
          : params.replace(/^\?/, '');
    }

    return this._queryString;
  }

  get query(): QueryParamsType {
    return this._query ?? '';
  }

  private set query(queryString: QueryParamsType) {
    this._query = queryString;
    this._queryString = undefined;
    this._parsedURL.search = this.queryString;
    this._cachedUrl = undefined;
  }

  get fragment(): string {
    return this._parsedURL.hash;
  }

  private _parsedHeaders!: Headers;
  private _headers?: HeadersType;

  get headers(): HeadersType {
    if (this._headers) {
      return this._headers;
    }

    if (!this._parsedHeaders.has('content-type') && this._parsedBody) {
      const contentType = this._parsedBody.type();
      if (contentType) {
        this._parsedHeaders.set('content-type', contentType);
      }
    }

    this._headers = Object.fromEntries(this._parsedHeaders);

    return this._headers;
  }

  private set headers(value: HeadersType) {
    this._parsedHeaders = new Headers(value);
    delete this._headers;
  }

  private _body?: BodyType;
  private _parsedBody?: Body;

  get body(): BodyType | undefined {
    return this._body;
  }

  private set body(value: BodyType | undefined) {
    if (
      value !== undefined &&
      (this.method === HttpMethod.GET || this.method === HttpMethod.HEAD)
    ) {
      throw new Error('Cannot set body for GET or HEAD requests');
    }

    this._body = value;

    if (value !== undefined) {
      const contentType = this._parsedHeaders.get('content-type');
      const { essence } = contentType ? new MIMEType(contentType) : {};

      this._parsedBody = new Body(value, essence);
    }
  }

  private readonly _serializeQuery: (params: QueryParamsType) => string;

  get serializeQuery(): (params: QueryParamsType) => string {
    return this._serializeQuery;
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
    this.headers = headers;
    this._serializeQuery = serializeQuery ?? this.defaultSerializeQuery;

    if (body !== undefined) {
      this.body = body;
    }

    if (query) {
      this.query = query;
    }
  }

  public async text(): Promise<string | undefined> {
    return this._parsedBody?.text();
  }

  private readonly defaultSerializeQuery = (params: QueryParamsType): string =>
    new URLSearchParams(params).toString();
}
