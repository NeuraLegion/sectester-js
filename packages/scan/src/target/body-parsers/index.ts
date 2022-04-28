import { BinaryBodyParser } from './BinaryBodyParser';
import { TextBodyParser } from './TextBodyParser';
import { FormDataBodyParser } from './FormDataBodyParser';
import { JsonBodyParser } from './JsonBodyParser';
import { UrlEncodedBodyParser } from './UrlEncodedBodyParser';
import { BodyParser } from './BodyParser';

export const BODY_PARSERS: readonly BodyParser[] = [
  new FormDataBodyParser(),
  new UrlEncodedBodyParser(),
  new BinaryBodyParser(),
  new TextBodyParser(),
  new JsonBodyParser()
];

export * from './BodyParser';
export * from './BinaryBodyParser';
export * from './FormDataBodyParser';
export * from './JsonBodyParser';
export * from './TextBodyParser';
export * from './UrlEncodedBodyParser';
