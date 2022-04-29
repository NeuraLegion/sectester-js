import { Target } from '../Target';
import { JsonBodyParser } from './JsonBodyParser';
import { inspect } from 'util';

describe('JsonBodyParser', () => {
  const jsonPatch = [{ op: 'replace', path: '/firstName', value: 'First' }];
  const json = { foo: 'bar' };
  const jsonArray = [116, 101, 115, 116];

  let parser!: JsonBodyParser;

  beforeEach(() => {
    parser = new JsonBodyParser();
  });

  describe('canParse', () => {
    it.each(
      [
        { input: { body: 'text' }, expected: false },
        { input: { body: jsonArray }, expected: true },
        { input: { body: 0x00 }, expected: false },
        { input: { body: json }, expected: true },
        {
          input: {
            body: JSON.stringify(json),
            headers: { 'content-type': 'application/json' }
          },
          expected: true
        },
        {
          input: {
            body: JSON.stringify(json),
            headers: { 'content-type': 'application/json;charset=UTF-8' }
          },
          expected: true
        },
        {
          input: {
            body: jsonPatch,
            headers: { 'content-type': 'application/json-patch+json' }
          },
          expected: true
        },
        {
          input: {
            body: JSON.stringify(jsonPatch),
            headers: { 'content-type': 'application/json-patch+json' }
          },
          expected: true
        }
      ].map(x => ({
        ...x,
        humanizedInput: inspect(x.input, {
          depth: 3,
          compact: true,
          maxArrayLength: 2
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
            body: json
          },
          expected: {
            text: JSON.stringify(json),
            contentType: 'application/json'
          }
        },
        {
          input: {
            body: JSON.stringify(json),
            headers: { 'content-type': 'application/json' }
          },
          expected: {
            text: JSON.stringify(json),
            contentType: 'application/json'
          }
        },
        {
          input: {
            body: JSON.stringify(json),
            headers: { 'content-type': 'application/json;charset=UTF-8' }
          },
          expected: {
            text: JSON.stringify(json),
            contentType: 'application/json;charset=UTF-8'
          }
        },
        {
          input: {
            body: jsonPatch,
            headers: { 'content-type': 'application/json-patch+json' }
          },
          expected: {
            text: JSON.stringify(jsonPatch),
            contentType: 'application/json-patch+json'
          }
        },
        {
          input: {
            body: JSON.stringify(jsonPatch),
            headers: { 'content-type': 'application/json-patch+json' }
          },
          expected: {
            text: JSON.stringify(jsonPatch),
            contentType: 'application/json-patch+json'
          }
        }
      ].map(x => ({
        ...x,
        humanizedExpected: inspect(x.expected, {
          depth: 3,
          compact: true,
          maxArrayLength: 2
        }),
        humanizedInput: inspect(x.input, {
          depth: 3,
          compact: true,
          maxArrayLength: 2
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
