import { URLSearchParamsConverter } from './URLSearchParamsConverter';

describe('URLSearchParamsConverter', () => {
  let converter: URLSearchParamsConverter;

  beforeEach(() => {
    converter = new URLSearchParamsConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: new URLSearchParams(), expected: true },
      { data: 'test', expected: false },
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
      {
        data: new URLSearchParams('foo=bar&baz=qux'),
        expected: 'foo=bar&baz=qux'
      },
      {
        data: new URLSearchParams({ foo: 'bar', baz: 'qux' }),
        expected: 'foo=bar&baz=qux'
      }
    ])('should convert $data to $expected', async ({ data, expected }) => {
      await expect(converter.convert(data)).resolves.toBe(expected);
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      expect(converter.getMimeType(new URLSearchParams())).toBe(
        'application/x-www-form-urlencoded'
      );
    });
  });
});
