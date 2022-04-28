import { BodyParser, ParsedBody } from './BodyParser';
import { Target } from '../Target';
import { isObject, isString } from '@secbox/core';

export class JsonBodyParser implements BodyParser {
  private readonly MIME_TYPE_REGEXP = /^application\/json[-+\w\d]*?\s*(;.*)?$/i;

  public canParse(target: Target): boolean {
    return (
      isObject(target.body) ||
      (isString(target.body) &&
        this.MIME_TYPE_REGEXP.test(target.contentType ?? ''))
    );
  }

  public parse(target: Target): ParsedBody {
    const text = isString(target.body)
      ? target.body
      : JSON.stringify(target.body);

    return { text, contentType: target.contentType ?? 'application/json' };
  }
}
