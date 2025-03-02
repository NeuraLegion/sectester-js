import { ArrayBufferConverter } from './ArrayBufferConverter';

describe('ArrayBufferConverter', () => {
  let converter: ArrayBufferConverter;

  beforeEach(() => {
    converter = new ArrayBufferConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: new ArrayBuffer(8), expected: true },
      { data: new Uint8Array([1, 2, 3]), expected: true },
      { data: new DataView(new ArrayBuffer(8)), expected: true },
      { data: 'string', expected: false },
      { data: 123, expected: false },
      { data: null, expected: false },
      { data: undefined, expected: false }
    ])('should return $expected when data is $data', ({ data, expected }) => {
      expect(converter.canHandle(data)).toBe(expected);
    });
  });

  describe('convert', () => {
    it.each([
      { data: new TextEncoder().encode('test').buffer, expected: 'test' },
      { data: new Uint8Array([116, 101, 115, 116]), expected: 'test' } // 'test' in ASCII
    ])('should convert buffer to string', async ({ data, expected }) => {
      await expect(converter.convert(data)).resolves.toBe(expected);
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      expect(converter.getMimeType(new ArrayBuffer(0))).toBe(
        'application/octet-stream'
      );
    });
  });
});
