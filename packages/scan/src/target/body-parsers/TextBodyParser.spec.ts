import { Target } from '../Target';
import { TextBodyParser } from './TextBodyParser';

describe('TextBodyParser', () => {
  let parser!: TextBodyParser;

  beforeEach(() => {
    parser = new TextBodyParser();
  });

  describe('canParse', () => {
    it.each([
      { input: 'text', expected: true },
      { input: 1, expected: true },
      { input: false, expected: true },
      { input: new Date(), expected: true },
      { input: { foo: 'bar' }, expected: false },
      { input: Symbol('foo'), expected: false },
      { input: NaN, expected: false }
    ])('should return $expected for $input', ({ input, expected }) => {
      // arrange
      const target = new Target({ url: 'https://example.com', body: input });

      // act
      const result = parser.canParse(target);

      // assert
      expect(result).toEqual(expected);
    });
  });

  describe('parse', () => {
    const currentDate = new Date();

    it.each([
      { input: 'text', expected: 'text' },
      { input: 1, expected: '1' },
      { input: false, expected: 'false' },
      { input: currentDate, expected: currentDate.toString() }
    ])('should return "$expected" for $input', ({ input, expected }) => {
      // arrange
      const target = new Target({ url: 'https://example.com', body: input });

      // act
      const result = parser.parse(target);

      // assert
      expect(result).toEqual({ text: expected, contentType: 'text/plain' });
    });
  });
});
