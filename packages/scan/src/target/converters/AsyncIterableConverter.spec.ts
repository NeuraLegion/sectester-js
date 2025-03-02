import { AsyncIterableConverter } from './AsyncIterableConverter';

// eslint-disable-next-line @typescript-eslint/require-await
async function* generateChunks() {
  yield new TextEncoder().encode('Hello');
  yield new TextEncoder().encode(' ');
  yield new TextEncoder().encode('World');
}

describe('AsyncIterableConverter', () => {
  let converter: AsyncIterableConverter;

  beforeEach(() => {
    converter = new AsyncIterableConverter();
  });

  describe('canHandle', () => {
    it.each([
      // eslint-disable-next-line @typescript-eslint/require-await
      { data: generateChunks(), expected: true },
      { data: {}, expected: false },
      { data: 'string', expected: false },
      { data: null, expected: false },
      { data: undefined, expected: false }
    ])('should return $expected when data is $data', ({ data, expected }) => {
      expect(converter.canHandle(data)).toBe(expected);
    });
  });

  describe('convert', () => {
    it('should convert async iterable to string', async () => {
      await expect(converter.convert(generateChunks())).resolves.toBe(
        'Hello World'
      );
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      expect(converter.getMimeType()).toBe('application/octet-stream');
    });
  });
});
