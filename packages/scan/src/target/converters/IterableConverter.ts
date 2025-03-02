import { BodyConverter } from './BodyConverter';

export class IterableConverter implements BodyConverter<Iterable<Uint8Array>> {
  public canHandle(data: unknown): data is Iterable<Uint8Array> {
    return typeof Object(data)[Symbol.iterator] === 'function';
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async convert(data: Iterable<Uint8Array>): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  }

  public getMimeType(_: Iterable<Uint8Array>): string {
    return 'application/octet-stream';
  }
}
