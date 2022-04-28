import { BodyParser, ParsedBody } from './BodyParser';
import { Target } from '../Target';
import { escape } from '../../utils';
import { isFormData, isString } from '@secbox/core';
import { Param } from '@har-sdk/core';

export class FormDataBodyParser implements BodyParser {
  private readonly MIME_TYPE_REGEXP =
    /^multipart\/form-data\s*;\s*boundary\s*=\s*(\S+)\s*$/i;
  private readonly FORM_DATA_KEY_VALUE_REGEXP = new RegExp(
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

  public canParse(target: Target): boolean {
    return (
      isFormData(target.body) ||
      (isString(target.body) &&
        this.MIME_TYPE_REGEXP.test(target.contentType ?? ''))
    );
  }

  public parse({
    body,
    contentType = 'multipart/form-data'
  }: Target): ParsedBody {
    let text = '';

    if (isString(body)) {
      text = body;
    } else if (isFormData(body)) {
      contentType = body.getHeaders()['content-type'];
      text = body.getBuffer().toString();
    }

    const [, boundary]: RegExpMatchArray =
      contentType.match(this.MIME_TYPE_REGEXP) ?? [];

    const params = boundary
      ? this.parseMultipartFormDataParameters(text, boundary)
      : [];

    return {
      text,
      params,
      contentType
    };
  }

  private parseMultipartFormDataParameters(
    data: string,
    boundary: string
  ): Param[] {
    const sanitizedBoundary = escape(boundary);
    const fields: string[] = data.split(
      // eslint-disable-next-line no-useless-escape
      new RegExp(`--${sanitizedBoundary}(?:--\s*$)?`, 'g')
    );

    return fields.reduce((result: Param[], field: string): Param[] => {
      const [match, name, fileName, contentType, value]: RegExpMatchArray =
        field.match(this.FORM_DATA_KEY_VALUE_REGEXP) || [];

      if (!match) {
        return result;
      }

      result.push({ name, value, fileName, contentType });

      return result;
    }, []);
  }
}
