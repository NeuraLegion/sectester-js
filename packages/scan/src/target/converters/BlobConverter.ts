import { isBlobLike } from '../../utils';
import { BodyConverter } from './BodyConverter';

export class BlobConverter implements BodyConverter<Blob> {
  public canHandle(data: unknown): data is Blob {
    return isBlobLike(data);
  }

  public async convert(data: Blob): Promise<string> {
    return new TextDecoder().decode(await data.arrayBuffer());
  }

  public getMimeType(data: Blob): string {
    return data.type || 'application/octet-stream';
  }
}
