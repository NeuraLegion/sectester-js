import { BodyConverter } from './BodyConverter';

export class ArrayBufferConverter
  implements BodyConverter<ArrayBuffer | NodeJS.ArrayBufferView>
{
  public canHandle(
    data: unknown
  ): data is ArrayBuffer | NodeJS.ArrayBufferView {
    return data instanceof ArrayBuffer || ArrayBuffer.isView(data);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async convert(
    data: ArrayBuffer | NodeJS.ArrayBufferView
  ): Promise<string> {
    return new TextDecoder().decode(data);
  }

  public getMimeType(_data: ArrayBuffer | NodeJS.ArrayBufferView): string {
    return 'application/octet-stream';
  }
}
