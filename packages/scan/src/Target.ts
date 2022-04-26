import { HttpMethod } from './models';
import FormData from 'form-data';

export interface Target {
  // The server URL that will be used for the request
  url: string;
  // The query parameters to be sent with the request
  query?: URLSearchParams | Record<string, string>;
  // The data to be sent as the request body.
  // The only required for POST, PUT, PATCH, and DELETE
  body?: FormData | URLSearchParams | string | unknown;
  // The request method to be used when making the request, GET by default
  method?: HttpMethod | string;
  // The headers
  headers?: Record<string, string>;
  // The optional method of serializing `query`
  // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
  serializeQuery?(params: URLSearchParams | Record<string, unknown>): string;
}
