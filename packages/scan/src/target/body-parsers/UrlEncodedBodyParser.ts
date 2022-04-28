import { BodyParser, ParsedBody } from './BodyParser';
import { Target } from '../Target';
import { entriesToList } from '../../utils';
import { isString, isURLSearchParams } from '@secbox/core';

export class UrlEncodedBodyParser implements BodyParser {
  private readonly MIME_TYPE_REGEXP =
    /^application\/x-www-form-urlencoded\s*(;.*)?$/i;

  public canParse({ body, contentType }: Target): boolean {
    return (
      isURLSearchParams(body) ||
      (isString(body) && this.MIME_TYPE_REGEXP.test(contentType ?? ''))
    );
  }

  public parse({
    body,
    contentType = 'application/x-www-form-urlencoded'
  }: Target): ParsedBody {
    const text =
      isURLSearchParams(body) || isString(body) ? body.toString() : '';
    const params = entriesToList(new URLSearchParams(text));

    return {
      text,
      params,
      contentType
    };
  }
}
