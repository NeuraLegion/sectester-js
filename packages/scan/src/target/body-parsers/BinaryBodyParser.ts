import { BodyParser, ParsedBody } from './BodyParser';
import { Target } from '../Target';

export class BinaryBodyParser implements BodyParser {
  public canParse(target: Target): boolean {
    return ArrayBuffer.isView(target.body);
  }

  public parse({ contentType, body }: Target): ParsedBody {
    const text = Buffer.from(body as ArrayBufferLike).toString();

    return { text, contentType: contentType ?? 'application/octet-stream' };
  }
}
