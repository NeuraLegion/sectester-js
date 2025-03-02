import { isStream } from '../../utils';
import { BodyConverter } from './BodyConverter';

export class StreamConverter implements BodyConverter<NodeJS.ReadableStream> {
  public canHandle(data: unknown): data is NodeJS.ReadableStream {
    return isStream(data);
  }

  public async convert(data: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of data) {
      chunks.push(Buffer.from(chunk));
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  }

  public getMimeType(_: NodeJS.ReadableStream): string {
    return 'application/octet-stream';
  }
}
