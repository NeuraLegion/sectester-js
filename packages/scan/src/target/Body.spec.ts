// eslint-disable-next-line max-classes-per-file
import { Body } from './Body';
import { File } from 'node:buffer';
import { Readable } from 'node:stream';

describe('Body', () => {
  describe('type', () => {
    it('should return text/plain for null data', () => {
      const body = new Body(null);
      expect(body.type()).toBe('text/plain');
    });

    it('should return application/json when the type is explicitly set', () => {
      const body = new Body('"1"', 'application/json');
      expect(body.type()).toBe('application/json');
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
      ['', 'application/octet-stream']
    ])('should use the type property of a Blob: %s', (mimeType, expected) => {
      const blob = new Blob(['content'], { type: mimeType });
      const body = new Body(blob);
      expect(body.type()).toBe(expected);
    });

    it.each([
      { name: 'test', value: 123 },
      { person: { name: 'John', age: 30 } },
      [{ person: { name: 'John', age: 30 } }]
    ])('should return application/json for plain objects: %j', testObject => {
      const body = new Body(testObject);
      expect(body.type()).toBe('application/json');
    });

    it.each([
      {
        name: 'ArrayBuffer',
        data: new ArrayBuffer(10),
        expected: 'application/octet-stream'
      },
      {
        name: 'Uint8Array',
        data: new Uint8Array(10),
        expected: 'application/octet-stream'
      }
    ])(
      'should return application/octet-stream for binary data: $name',
      ({ data, expected }) => {
        const body = new Body(data);
        expect(body.type()).toBe(expected);
      }
    );

    it.each([
      {
        name: 'ReadableStream',
        data: Readable.from(['data']),
        expected: 'application/octet-stream'
      },
      {
        name: 'Iterable<Uint8Array>',
        data: (function* generator() {
          yield new Uint8Array([1, 2, 3]);
        })(),
        expected: 'application/octet-stream'
      }
    ])(
      'should return application/octet-stream for $name',
      ({ data, expected }) => {
        const body = new Body(data);
        expect(body.type()).toBe(expected);
      }
    );

    it('should return application/json for custom iterator objects', () => {
      const iterableObj = {
        *[Symbol.iterator]() {
          yield 1;
          yield 2;
          yield 3;
        }
      };

      const body = new Body(iterableObj);
      expect(body.type()).toBe('application/json');
    });
  });

  describe('text', () => {
    it.each([
      {
        name: 'string',
        data: 'Hello, World!',
        expected: 'Hello, World!'
      },
      {
        name: 'null',
        data: null,
        expected: 'null'
      },
      {
        name: 'URLSearchParams',
        data: new URLSearchParams({ foo: 'bar', baz: 'qux' }),
        expected: 'foo=bar&baz=qux'
      },
      {
        name: 'JSON object',
        data: { foo: 'bar', nested: { value: 42 } },
        expected: JSON.stringify({ foo: 'bar', nested: { value: 42 } })
      },
      {
        name: 'JSON array',
        data: [{ foo: 'bar', nested: { value: 42 } }],
        expected: JSON.stringify([{ foo: 'bar', nested: { value: 42 } }])
      },
      {
        name: 'ArrayBufferView',
        data: new TextEncoder().encode('Hello, Binary World!').buffer,
        expected: 'Hello, Binary World!'
      },
      {
        name: 'ArrayBufferView',
        data: new TextEncoder().encode('ArrayBufferView data test'),
        expected: 'ArrayBufferView data test'
      },
      {
        name: 'Blob',
        data: new Blob(['Blob content'], { type: 'text/plain' }),
        expected: 'Blob content'
      },
      {
        name: 'File',
        data: new File(['file content'], 'test.txt', { type: 'text/plain' }),
        expected: 'file content'
      },
      { name: 'number', data: 123, expected: '123' },
      { name: 'boolean', data: true, expected: 'true' },
      { name: 'bigint', data: BigInt(42), expected: '42' },
      {
        name: 'Date',
        data: new Date('2021-01-01T12:00:00Z'),
        expected: '"2021-01-01T12:00:00.000Z"'
      },
      {
        name: 'Instance of custom class',
        data: new (class CustomClass {
          public foo = 'bar';
        })(),
        expected: '{"foo":"bar"}'
      }
    ])('should handle $name data', async ({ data, expected }) => {
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
      expect(result).toContain('name="file"');
      expect(result).toContain('content-type: text/plain');
      expect(result).toContain('file content');
    });

    it.each([
      { name: 'number', data: 123, expected: '123' },
      { name: 'boolean', data: true, expected: 'true' },
      {
        name: 'date',
        data: new Date('2021-01-01T12:00:00Z'),
        expected: '"2021-01-01T12:00:00.000Z"'
      },
      {
        name: 'Instance of custom class',
        data: new (class CustomClass {
          public foo = 'bar';
        })(),
        expected: '{"foo":"bar"}'
      }
    ])(
      'should handle primitive as JSON data: $name',
      async ({ data, expected }) => {
        const body = new Body(data, 'application/json');
        await expect(body.text()).resolves.toBe(expected);
      }
    );
  });
});
