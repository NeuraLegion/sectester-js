import { Target } from '../Target';
import { FormDataBodyParser } from './FormDataBodyParser';
// eslint-disable-next-line @typescript-eslint/naming-convention
import FormData from 'form-data';
import { inspect } from 'util';

describe('FormDataBodyParser', () => {
  const fileWithFilename = new FormData();
  fileWithFilename.append('file', Buffer.from('text'), {
    filename: 'file.txt'
  });

  const field = new FormData();
  field.append('value', Buffer.from('text'));

  const fileWithPath = new FormData();
  fileWithPath.append('file', Buffer.from('text'), {
    filepath: '/home/ubuntu/file.txt'
  });

  let parser!: FormDataBodyParser;

  beforeEach(() => {
    parser = new FormDataBodyParser();
  });

  describe('canParse', () => {
    it.each(
      [
        { input: { body: 'text' }, expected: false },
        { input: { body: 0x00 }, expected: false },
        { input: { body: { foo: 'bar' } }, expected: false },
        {
          input: {
            body: field
          },
          expected: true
        },
        {
          input: {
            body: fileWithFilename.getBuffer().toString(),
            headers: fileWithFilename.getHeaders()
          },
          expected: true
        },
        {
          input: {
            body: fileWithPath.getBuffer().toString()
          },
          expected: false
        }
      ].map(x => ({
        ...x,
        humanizedInput: inspect(x.input, {
          depth: 3,
          compact: true,
          maxArrayLength: 2,
          maxStringLength: 10
        })
      }))
    )('should return $expected for $humanizedInput', ({ input, expected }) => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        ...input
      });

      // act
      const result = parser.canParse(target);

      // assert
      expect(result).toEqual(expected);
    });
  });

  describe('parse', () => {
    it.each(
      [
        {
          input: {
            body: field
          },
          expected: {
            text: field.getBuffer().toString(),
            params: [
              {
                name: 'value',
                value: 'text',
                contentType: 'application/octet-stream'
              }
            ],
            contentType: field.getHeaders()['content-type']
          }
        },
        {
          input: {
            body: fileWithFilename.getBuffer().toString(),
            headers: fileWithFilename.getHeaders()
          },
          expected: {
            text: fileWithFilename.getBuffer().toString(),
            params: [
              {
                name: 'file',
                value: 'text',
                fileName: 'file.txt',
                contentType: 'text/plain'
              }
            ],
            contentType: fileWithFilename.getHeaders()['content-type']
          }
        },
        {
          input: {
            body: fileWithPath.getBuffer().toString(),
            headers: fileWithPath.getHeaders()
          },
          expected: {
            text: fileWithPath.getBuffer().toString(),
            params: [
              {
                name: 'file',
                value: 'text',
                contentType: 'text/plain',
                fileName: '/home/ubuntu/file.txt'
              }
            ],
            contentType: fileWithPath.getHeaders()['content-type']
          }
        }
      ].map(x => ({
        ...x,
        humanizedExpected: inspect(x.expected, {
          depth: 3,
          compact: true,
          maxArrayLength: 2,
          maxStringLength: 10
        }),
        humanizedInput: inspect(x.input, {
          depth: 3,
          compact: true,
          maxArrayLength: 2,
          maxStringLength: 10
        })
      }))
    )(
      'should return $humanizedExpected for $humanizedInput',
      ({ input, expected }) => {
        // arrange
        const target = new Target({
          url: 'https://example.com',
          ...input
        });

        // act
        const result = parser.parse(target);

        // assert
        expect(result).toEqual(expected);
      }
    );
  });
});
