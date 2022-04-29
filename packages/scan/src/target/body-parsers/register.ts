import { BinaryBodyParser } from './BinaryBodyParser';
import { FormDataBodyParser } from './FormDataBodyParser';
import { TextBodyParser } from './TextBodyParser';
import { UrlEncodedBodyParser } from './UrlEncodedBodyParser';
import { JsonBodyParser } from './JsonBodyParser';
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
