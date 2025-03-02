import { StringConverter } from './StringConverter';

describe('StringConverter', () => {
  let converter: StringConverter;

  beforeEach(() => {
    converter = new StringConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: 'test', expected: true },
      { data: {}, expected: false },
      { data: 123, expected: false },
      { data: null, expected: false },
      { data: undefined, expected: false }
    ])('should return $expected when data is $data', ({ data, expected }) => {
      expect(converter.canHandle(data)).toBe(expected);
    });
  });

  describe('convert', () => {
    it.each([
      { data: 'test', expected: 'test' },
      { data: '{"foo":"bar"}', expected: '{"foo":"bar"}' },
      { data: '<xml>test</xml>', expected: '<xml>test</xml>' }
    ])('should convert $data to $expected', async ({ data, expected }) => {
      await expect(converter.convert(data)).resolves.toBe(expected);
    });
  });

  describe('getMimeType', () => {
    it.each([
      { data: '{"foo":"bar"}', expected: 'application/json' },
      { data: '  {"foo":"bar"}  ', expected: 'application/json' },
      { data: '<xml>test</xml>', expected: 'application/xml' },
      { data: '  <xml>test</xml>  ', expected: 'application/xml' },
      { data: 'plain text', expected: 'text/plain' }
    ])('should return $expected for $data', ({ data, expected }) => {
      expect(converter.getMimeType(data)).toBe(expected);
    });
  });
});
