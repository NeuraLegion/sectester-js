import { BodyConverter } from './BodyConverter';

export class AsyncIterableConverter
  implements BodyConverter<AsyncIterable<Uint8Array>>
{
  public canHandle(data: unknown): data is AsyncIterable<Uint8Array> {
    return typeof Object(data)[Symbol.asyncIterator] === 'function';
  }

  public async convert(data: AsyncIterable<Uint8Array>): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  }

  public getMimeType(): string {
    return 'application/octet-stream';
  }
}
