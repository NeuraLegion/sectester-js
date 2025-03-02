import { BodyConverter } from './BodyConverter';
import { isJsonSerializable } from '../../utils/is-json-serializable';
import { isPrimitive } from '../../utils/is-primitive';

export class JsonConverter implements BodyConverter<unknown> {
  public canHandle(data: unknown, mimeType?: string): data is unknown {
    if (mimeType === 'application/json') return true;

    return isJsonSerializable(data) && !isPrimitive(data);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async convert(data: unknown): Promise<string> {
    return JSON.stringify(data);
  }

  public getMimeType(_data: unknown): string {
    return 'application/json';
  }
}
