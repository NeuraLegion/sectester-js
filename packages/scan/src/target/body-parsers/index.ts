import { BinaryBodyParser } from './BinaryBodyParser';
import { TextBodyParser } from './TextBodyParser';
import { FormDataBodyParser } from './FormDataBodyParser';
import { JsonBodyParser } from './JsonBodyParser';
import { UrlEncodedBodyParser } from './UrlEncodedBodyParser';
import { BodyParser } from './BodyParser';
import { container } from 'tsyringe';

container
  .register(BodyParser, {
    useClass: FormDataBodyParser
  })
  .register(BodyParser, {
    useClass: UrlEncodedBodyParser
  })
  .register(BodyParser, {
    useClass: BinaryBodyParser
  })
  .register(BodyParser, {
    useClass: TextBodyParser
  })
  .register(BodyParser, {
    useClass: JsonBodyParser
  });

export * from './BodyParser';
