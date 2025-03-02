import { JsonConverter } from './JsonConverter';

describe('JsonConverter', () => {
  let converter: JsonConverter;

  beforeEach(() => {
    converter = new JsonConverter();
  });

  describe('canHandle', () => {
    it.each([
      { data: {}, expected: true, mimeType: undefined },
      { data: { foo: 'bar' }, expected: true, mimeType: undefined },
      { data: ['foo', 'bar'], expected: true, mimeType: undefined },
      { data: 'string', expected: false, mimeType: undefined },
      { data: 123, expected: false, mimeType: undefined },
      { data: null, expected: false, mimeType: undefined },
      { data: {}, expected: true, mimeType: 'application/json' },
      { data: 'string', expected: true, mimeType: 'application/json' },
      { data: 123, expected: true, mimeType: 'application/json' }
    ])(
      'should return $expected when data is $data and mimeType is $mimeType',
      ({ data, expected, mimeType }) => {
        expect(converter.canHandle(data, mimeType)).toBe(expected);
      }
    );
  });

  describe('convert', () => {
    it.each([
      { data: { foo: 'bar' }, expected: '{"foo":"bar"}' },
      { data: ['foo', 'bar'], expected: '["foo","bar"]' },
      { data: null, expected: 'null' }
    ])('should convert $data to $expected', async ({ data, expected }) => {
      await expect(converter.convert(data)).resolves.toBe(expected);
    });
  });

  describe('getMimeType', () => {
    it('should return the correct mime type', () => {
      expect(converter.getMimeType({})).toBe('application/json');
    });
  });
});
