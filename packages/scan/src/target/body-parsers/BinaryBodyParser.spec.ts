import { BinaryBodyParser } from './BinaryBodyParser';
import { Target } from '../Target';
import { inspect } from 'util';

describe('BinaryBodyParser', () => {
  let parser!: BinaryBodyParser;

  beforeEach(() => {
    parser = new BinaryBodyParser();
  });

  describe('canParse', () => {
    it.each(
      [
        { input: 'text', expected: false },
        { input: [116, 101, 115, 116], expected: false },
        { input: 0x00, expected: false },
        { input: { foo: 'bar' }, expected: false },
        { input: Buffer.from('test'), expected: true },
        { input: Uint8Array.from([116, 101, 115, 116]), expected: true },
        { input: Int16Array.from([116, 101, 115, 116]), expected: true },
        { input: Float64Array.from([116, 101, 115, 116]), expected: true },
        { input: Float32Array.from([116, 101, 115, 116]), expected: true }
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
      const target = new Target({ url: 'https://example.com', body: input });

      // act
      const result = parser.canParse(target);

      // assert
      expect(result).toEqual(expected);
    });
  });

  describe('parse', () => {
    it.each(
      [
        { input: Buffer.from('test') },
        { input: Uint8Array.from([116, 101, 115, 116]) },
        { input: Int16Array.from([116, 101, 115, 116]) },
        { input: Float64Array.from([116, 101, 115, 116]) },
        { input: Float32Array.from([116, 101, 115, 116]) }
      ].map(x => ({
        ...x,
        humanizedInput: inspect(x.input, {
          depth: 3,
          compact: true,
          maxArrayLength: 2
        })
      }))
    )('should parse $humanizedInput', ({ input }) => {
      // arrange
      const target = new Target({ url: 'https://example.com', body: input });

      // act
      const result = parser.parse(target);

      // assert
      expect(result).toEqual({
        text: 'test',
        contentType: 'application/octet-stream'
      });
    });
  });
});
