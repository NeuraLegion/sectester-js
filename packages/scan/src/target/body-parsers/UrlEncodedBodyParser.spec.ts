import { Target } from '../Target';
import { UrlEncodedBodyParser } from './UrlEncodedBodyParser';
import { inspect } from 'util';

describe('UrlEncodedBodyParser', () => {
  let parser!: UrlEncodedBodyParser;

  beforeEach(() => {
    parser = new UrlEncodedBodyParser();
  });

  describe('canParse', () => {
    it.each(
      [
        { input: { body: 'text' }, expected: false },
        { input: { body: [116, 101, 115, 116] }, expected: false },
        { input: { body: 0x00 }, expected: false },
        { input: { body: { foo: 'bar' } }, expected: false },
        {
          input: { body: new URLSearchParams({ foo: 'bar' }) },
          expected: true
        },
        {
          input: {
            body: 'foo=bar',
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
          },
          expected: true
        },
        {
          input: {
            body: 'foo=bar'
          },
          expected: false
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
      const target = new Target({ url: 'https://example.com', ...input });

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
          input: { body: new URLSearchParams({ foo: 'bar' }) },
          expected: {
            text: 'foo=bar',
            params: [
              {
                name: 'foo',
                value: 'bar'
              }
            ],
            contentType: 'application/x-www-form-urlencoded'
          }
        },
        {
          input: {
            body: 'foo=bar',
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
          },
          expected: {
            text: 'foo=bar',
            params: [
              {
                name: 'foo',
                value: 'bar'
              }
            ],
            contentType: 'application/x-www-form-urlencoded'
          }
        }
      ].map(x => ({
        ...x,
        humanizedInput: inspect(x.input, {
          depth: 3,
          compact: true,
          maxArrayLength: 2
        })
      }))
    )(
      'should return $expected.text for $humanizedInput',
      ({ input, expected }) => {
        // arrange
        const target = new Target({ url: 'https://example.com', ...input });

        // act
        const result = parser.parse(target);

        // assert
        expect(result).toEqual(expected);
      }
    );
  });
});
