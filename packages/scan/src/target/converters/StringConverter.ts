import { BodyConverter } from './BodyConverter';
import { isJson } from '../../utils/is-json';
import { isXml } from '../../utils/is-xml';

export class StringConverter implements BodyConverter<string> {
  public canHandle(data: unknown): data is string {
    return typeof data === 'string';
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async convert(data: string): Promise<string> {
    return data;
  }

  public getMimeType(data: string): string {
    const trimmed = data.trim();

    if (isJson(trimmed)) {
      return 'application/json';
    }

    if (isXml(trimmed)) {
      return 'application/xml';
    }

    return 'text/plain';
  }
}
