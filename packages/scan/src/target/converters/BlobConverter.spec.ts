import { BlobConverter } from './BlobConverter';

describe('BlobConverter', () => {
  let converter: BlobConverter;

  beforeEach(() => {
    converter = new BlobConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: new Blob(['test']), expected: true },
      { data: new Blob(['test'], { type: 'text/plain' }), expected: true },
      { data: 'string', expected: false },
      { data: {}, expected: false },
      { data: null, expected: false },
      { data: undefined, expected: false }
    ])('should return $expected when data is $data', ({ data, expected }) => {
      expect(converter.canHandle(data)).toBe(expected);
    });
  });

  describe('convert', () => {
    it.each([
      { data: new Blob(['test']), expected: 'test' },
      { data: new Blob(['{"foo":"bar"}']), expected: '{"foo":"bar"}' }
    ])('should convert blob to string', async ({ data, expected }) => {
      await expect(converter.convert(data)).resolves.toBe(expected);
    });
  });

  describe('getMimeType', () => {
    it.each([
      { data: new Blob(['test']), expected: 'application/octet-stream' },
      {
        data: new Blob(['test'], { type: 'text/plain' }),
        expected: 'text/plain'
      },
      {
        data: new Blob(['test'], { type: 'application/json' }),
        expected: 'application/json'
      }
    ])('should return $expected for $data', ({ data, expected }) => {
      expect(converter.getMimeType(data)).toBe(expected);
    });
  });
});
