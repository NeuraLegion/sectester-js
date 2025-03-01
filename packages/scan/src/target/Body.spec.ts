import { Body } from './Body';
import { File } from 'node:buffer';
import { Readable } from 'node:stream';

describe('Body', () => {
  describe('type', () => {
    it('should return text/plain for null data', () => {
      const body = new Body(null);
      expect(body.type()).toBe('text/plain');
    });

    it.each([
      ['{"name": "test", "value": 123}', 'application/json'],
      ['[1, 2, 3]', 'application/json'],
      ['{}', 'application/json'],
      ['[]', 'application/json'],
      ['  {"name": "test"}  ', 'application/json']
    ])(
      'should detect application/json for JSON string: %s',
      (jsonString, expected) => {
        const body = new Body(jsonString);
        expect(body.type()).toBe(expected);
      }
    );

    it.each([
      ['{not valid json}', 'text/plain'],
      ['Hello, World!', 'text/plain']
    ])(
      'should return text/plain for non-JSON string: %s',
      (textString, expected) => {
        const body = new Body(textString);
        expect(body.type()).toBe(expected);
      }
    );

    it.each([
      [
        '<?xml version="1.0" encoding="UTF-8"?><root><element>value</element></root>',
        'application/xml'
      ],
      ['<root><element>value</element></root>', 'application/xml']
    ])(
      'should detect application/xml for XML string: %s',
      (xmlString, expected) => {
        const body = new Body(xmlString);
        expect(body.type()).toBe(expected);
      }
    );

    it.each([
      ['<root>no closing tag', 'text/plain'],
      ['<!DOCTYPE html><html><body>Hello</body></html>', 'text/plain'],
      ['<!-- This is a comment -->', 'text/plain']
    ])(
      'should return text/plain for non-XML string: %s',
      (textString, expected) => {
        const body = new Body(textString);
        expect(body.type()).toBe(expected);
      }
    );

    it('should return multipart/form-data for FormData', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      const body = new Body(formData);
      expect(body.type()).toBe('multipart/form-data');
    });

    it('should return application/x-www-form-urlencoded for URLSearchParams', () => {
      const params = new URLSearchParams({ foo: 'bar' });
      const body = new Body(params);
      expect(body.type()).toBe('application/x-www-form-urlencoded');
    });

    it.each([
      ['text/custom', 'text/custom'],
      ['application/custom-json', 'application/custom-json'],
      ['', '']
    ])('should use the type property of a Blob: %s', (mimeType, expected) => {
      const blob = new Blob(['content'], { type: mimeType });
      const body = new Body(blob);
      expect(body.type()).toBe(expected);
    });

    it.each([
      [{ name: 'test', value: 123 }],
      [{ person: { name: 'John', age: 30 } }]
    ])('should return application/json for plain objects: %j', testObject => {
      const body = new Body(testObject);
      expect(body.type()).toBe('application/json');
    });

    it.each([
      ['ArrayBuffer', () => new ArrayBuffer(10)],
      ['Uint8Array', () => new Uint8Array(10)]
    ])(
      'should return application/octet-stream for binary data: %s',
      (_, createData) => {
        const body = new Body(createData());
        expect(body.type()).toBe('application/octet-stream');
      }
    );

    it.each([
      ['ReadableStream', () => Readable.from(['data'])],
      [
        'Iterable<Uint8Array>',
        () => {
          function* generator() {
            yield new Uint8Array([1, 2, 3]);
          }

          return generator();
        }
      ]
    ])('should return application/octet-stream for %s', (_, createData) => {
      const body = new Body(createData());
      expect(body.type()).toBe('application/octet-stream');
    });
  });

  describe('text', () => {
    it('should handle string data', async () => {
      const body = new Body('Hello, World!');
      await expect(body.text()).resolves.toBe('Hello, World!');
    });

    it('should handle null data', async () => {
      const body = new Body(null);
      await expect(body.text()).resolves.toBe(undefined);
    });

    it.each([
      [
        'URLSearchParams',
        new URLSearchParams({ foo: 'bar', baz: 'qux' }),
        'foo=bar&baz=qux'
      ],
      [
        'JSON object',
        { foo: 'bar', nested: { value: 42 } },
        JSON.stringify({ foo: 'bar', nested: { value: 42 } })
      ]
    ])('should handle %s data', async (_, data, expected) => {
      const body = new Body(data);
      await expect(body.text()).resolves.toBe(expected);
    });

    it.each([
      [
        'ArrayBuffer',
        {
          data: new TextEncoder().encode('Hello, Binary World!').buffer,
          expected: 'Hello, Binary World!'
        }
      ],
      [
        'ArrayBufferView',
        {
          data: new TextEncoder().encode('ArrayBufferView data test'),
          expected: 'ArrayBufferView data test'
        }
      ],
      [
        'Blob',
        {
          data: new Blob(['Blob content'], { type: 'text/plain' }),
          expected: 'Blob content'
        }
      ],
      [
        'File',
        {
          data: new File(['file content'], 'test.txt', { type: 'text/plain' }),
          expected: 'file content'
        }
      ]
    ])('should handle %s data', async (_, testData) => {
      const { data, expected } = testData;
      const body = new Body(data);
      await expect(body.text()).resolves.toBe(expected);
    });

    it('should handle Iterable<Uint8Array> data', async () => {
      const chunks = [
        new TextEncoder().encode('First chunk. '),
        new TextEncoder().encode('Second chunk.')
      ];

      function* generator() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const body = new Body(generator());
      await expect(body.text()).resolves.toBe('First chunk. Second chunk.');
    });

    it('should handle ReadableStream data', async () => {
      const readable = Readable.from(['Stream ', 'of ', 'data']);
      const body = new Body(readable);
      await expect(body.text()).resolves.toBe('Stream of data');
    });

    it('should handle AsyncIterable<Uint8Array> data', async () => {
      const chunks = [
        new TextEncoder().encode('Async '),
        new TextEncoder().encode('iterable '),
        new TextEncoder().encode('data')
      ];

      async function* generator() {
        for (const chunk of chunks) {
          yield await chunk;
        }
      }

      const body = new Body(generator());
      await expect(body.text()).resolves.toBe('Async iterable data');
    });

    it('should handle FormData with text values', async () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');

      const body = new Body(formData);
      const result = await body.text();

      expect(result).toContain('name="name"');
      expect(result).toContain('John Doe');
      expect(result).toContain('name="email"');
      expect(result).toContain('john@example.com');
      expect(result).toMatch(/^--.*BrightFormBoundary/);
    });

    it('should handle FormData with file values', async () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');

      const blob = new Blob(['file content'], { type: 'text/plain' });
      formData.append('file', blob);

      const body = new Body(formData);
      const result = await body.text();

      expect(result).toContain('name="name"');
      expect(result).toContain('John Doe');
      expect(result).toContain('name="blob"');
      expect(result).toContain('content-type: text/plain');
      expect(result).toContain('file content');
    });

    it('should throw error for unsupported data types', async () => {
      // @ts-expect-error Testing with an invalid type
      const body = new Body(Symbol('test'));
      await expect(body.text()).rejects.toThrow('Unsupported data type');
    });
  });
});
