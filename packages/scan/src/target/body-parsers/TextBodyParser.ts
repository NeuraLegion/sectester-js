import { BodyParser, ParsedBody } from './BodyParser';
import { Target } from '../Target';
import { isBoolean, isDate, isNumber, isString } from '@secbox/core';

export class TextBodyParser implements BodyParser {
  public canParse({ body }: Target): boolean {
    return isDate(body) || isBoolean(body) || isNumber(body) || isString(body);
  }

  public parse({ body, contentType = 'text/plain' }: Target): ParsedBody {
    const text = (body as any).toString();

    return { text, contentType };
  }
}
