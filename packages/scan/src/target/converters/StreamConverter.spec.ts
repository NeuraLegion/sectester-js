import { StreamConverter } from './StreamConverter';
import { Readable } from 'node:stream';

describe('StreamConverter', () => {
  let converter: StreamConverter;

  beforeEach(() => {
    converter = new StreamConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: Readable.from('test'), expected: true },
      { data: Readable.from(Buffer.from('test')), expected: true },
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
      { input: 'test', expected: 'test' },
      { input: Buffer.from('test'), expected: 'test' }
    ])('should convert stream to string', async ({ input, expected }) => {
      const stream = Readable.from(input);
      await expect(converter.convert(stream)).resolves.toBe(expected);
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      const stream = Readable.from('test');
      expect(converter.getMimeType(stream)).toBe('application/octet-stream');
    });
  });
});
