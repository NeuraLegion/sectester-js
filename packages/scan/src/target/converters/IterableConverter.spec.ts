import { IterableConverter } from './IterableConverter';

describe('IterableConverter', () => {
  let converter: IterableConverter;

  beforeEach(() => {
    converter = new IterableConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: new Set([]), expected: true },
      { data: new Map(), expected: true },
      { data: [1, 2, 3], expected: true },
      { data: 'string', expected: true }, // Strings are also iterable
      { data: {}, expected: false },
      { data: 123, expected: false },
      { data: null, expected: false },
      { data: undefined, expected: false }
    ])('should return $expected when data is $data', ({ data, expected }) => {
      expect(converter.canHandle(data)).toBe(expected);
    });
  });

  describe('convert', () => {
    it('should convert iterable to string', async () => {
      function* generateChunks() {
        yield new TextEncoder().encode('Hello');
        yield new TextEncoder().encode(' ');
        yield new TextEncoder().encode('World');
      }

      await expect(converter.convert(generateChunks())).resolves.toBe(
        'Hello World'
      );
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      expect(converter.getMimeType([] as Iterable<Uint8Array>)).toBe(
        'application/octet-stream'
      );
    });
  });
});
