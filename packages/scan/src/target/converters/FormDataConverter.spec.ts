import { FormDataConverter } from './FormDataConverter';

jest.mock('node:crypto', () => ({
  getRandomValues: jest.fn().mockReturnValue(new Uint32Array(10).fill(123456))
}));

describe('FormDataConverter', () => {
  let converter: FormDataConverter;

  beforeEach(() => {
    converter = new FormDataConverter();
    jest.clearAllMocks();
  });

  describe('canHandle', () => {
    it.each([
      { data: new FormData(), expected: true },
      { data: 'string', expected: false },
      { data: {}, expected: false },
      { data: null, expected: false },
      { data: undefined, expected: false }
    ])('should return $expected when data is $data', ({ data, expected }) => {
      expect(converter.canHandle(data)).toBe(expected);
    });
  });

  describe('convert', () => {
    it('should convert FormData with string values', async () => {
      const formData = new FormData();
      formData.append('foo', 'bar');
      formData.append('baz', 'qux');

      const result = await converter.convert(formData);

      expect(result).toContain('--BrightFormBoundary');
      expect(result).toContain('name="foo"');
      expect(result).toContain('bar');
      expect(result).toContain('name="baz"');
      expect(result).toContain('qux');
    });

    it('should convert FormData with file values', async () => {
      const formData = new FormData();
      const file = new Blob(['file content'], { type: 'text/plain' });
      formData.append('file', file);

      const result = await converter.convert(formData);

      expect(result).toContain('--BrightFormBoundary');
      expect(result).toContain('name="file"');
      expect(result).toContain('filename="text/plain"');
      expect(result).toContain('content-type: text/plain');
      expect(result).toContain('file content');
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      expect(converter.getMimeType(new FormData())).toBe('multipart/form-data');
    });
  });
});
