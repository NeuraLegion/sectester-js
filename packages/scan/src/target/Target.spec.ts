import { Target } from './Target';
import FormData from 'form-data';

describe('Target', () => {
  describe('toHarRequest', () => {
    it('should return a simple GET request', () => {
      // arrange
      const target = new Target({ url: 'https://example.com' });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `queryString`', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        query: 'foo=bar'
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?foo=bar',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'foo', value: 'bar' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should use a custom query string serializer', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        query: { foo: ['bar', 'baz'] },
        serializeQuery(_: Record<string, string | string[]>): string {
          return 'foo=bar|baz';
        }
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?foo=bar|baz',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'foo', value: 'bar|baz' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `queryString` parsing a URLSearchParams', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        query: new URLSearchParams('foo=bar')
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?foo=bar',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'foo', value: 'bar' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `queryString` parsing a record', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        query: { foo: 'bar' }
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?foo=bar',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'foo', value: 'bar' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `queryString` parsing an URL', () => {
      // arrange
      const target = new Target({ url: 'https://example.com?foo=bar' });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?foo=bar',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'foo', value: 'bar' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `queryString` merging keys with the same name', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        query: { baz: ['foo', 'bar'] }
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?baz=foo%2Cbar',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'baz', value: 'foo,bar' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should override a `queryString`', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com?foo=bar',
        query: 'bar=foo'
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/?bar=foo',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [{ name: 'bar', value: 'foo' }],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `headers`', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [{ name: 'content-type', value: 'application/json' }],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `headers` merging keys with the same name', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com',
        headers: { cookie: ['foo=bar', 'bar=foo'] }
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          { name: 'cookie', value: 'foo=bar' },
          { name: 'cookie', value: 'bar=foo' }
        ],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should normalize URL', () => {
      // arrange
      const target = new Target({
        url: 'HTTPS://EXAMPLE.COM///'
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should obtain HTTP version', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com/',
        headers: { version: 'HTTP/1.1' }
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/',
        httpVersion: 'HTTP/1.1',
        headers: [{ name: 'version', value: 'HTTP/1.1' }],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set method to default if supplied value is invalid', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com/',
        method: 'xxx'
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'GET',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing a FormData', () => {
      // arrange
      const value = Buffer.from([0x01, 0x09, 0x09, 0x04]);
      const form = new FormData();
      form.append('file', value, {
        filename: 'file.bin'
      });

      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        body: form
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: form.getHeaders()?.['content-type']
          }
        ],
        queryString: [],
        postData: {
          mimeType: expect.stringMatching('multipart/form-data'),
          text: form.getBuffer().toString(),
          params: [
            {
              contentType: 'application/octet-stream',
              fileName: 'file.bin',
              name: 'file',
              value: value.toString()
            }
          ]
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing multipart/form-data', () => {
      // arrange
      const value = Buffer.from([0x01, 0x09, 0x09, 0x04]);
      const form = new FormData();
      form.append('file', value, {
        filename: 'file.bin'
      });

      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        headers: form.getHeaders(),
        body: form.getBuffer().toString()
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: form.getHeaders()?.['content-type']
          }
        ],
        queryString: [],
        postData: {
          mimeType: expect.stringMatching('multipart/form-data'),
          text: form.getBuffer().toString(),
          params: [
            {
              contentType: 'application/octet-stream',
              fileName: 'file.bin',
              name: 'file',
              value: value.toString()
            }
          ]
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing a plain object', () => {
      // arrange
      const value = { foo: 'bar' };
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        body: value
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: 'application/json'
          }
        ],
        queryString: [],
        postData: {
          mimeType: expect.stringMatching('application/json'),
          text: JSON.stringify(value)
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing a JSON', () => {
      // arrange
      const value = { foo: 'bar' };
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(value)
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: 'application/json'
          }
        ],
        queryString: [],
        postData: {
          mimeType: expect.stringMatching('application/json'),
          text: JSON.stringify(value)
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should recognize a JSON by content-type', () => {
      // arrange
      const value = [{ op: 'replace', path: '/firstName', value: 'First' }];
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        headers: { 'content-type': 'application/json-patch+json' },
        body: value
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: 'application/json-patch+json'
          }
        ],
        queryString: [],
        postData: {
          mimeType: 'application/json-patch+json',
          text: JSON.stringify(value)
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing an URLSearchParams', () => {
      // arrange
      const value = new URLSearchParams('foo=bar');
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        body: value
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        queryString: [],
        postData: {
          mimeType: expect.stringMatching('application/x-www-form-urlencoded'),
          text: value.toString(),
          params: [
            {
              name: 'foo',
              value: 'bar'
            }
          ]
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing application/x-www-form-urlencoded', () => {
      // arrange
      const value = 'foo=bar';
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: value
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [
          {
            name: 'content-type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        queryString: [],
        postData: {
          mimeType: expect.stringMatching('application/x-www-form-urlencoded'),
          text: value,
          params: [
            {
              name: 'foo',
              value: 'bar'
            }
          ]
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` to undefined', () => {
      // arrange
      const value = Symbol('foo');
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        body: value
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` parsing a Buffer', () => {
      // arrange
      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        body: Buffer.from('text')
      });

      // act
      const result = target.toHarRequest();

      // assert
      expect(result).toEqual({
        method: 'POST',
        url: 'https://example.com/',
        httpVersion: 'HTTP/0.9',
        headers: [{ name: 'content-type', value: 'application/octet-stream' }],
        queryString: [],
        postData: {
          mimeType: 'application/octet-stream',
          text: 'text'
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it.each(['text', 1, false, new Date()])(
      'should set `postData` serializing %o',
      input => {
        // arrange
        const target = new Target({
          url: 'https://example.com/',
          method: 'POST',
          body: input
        });

        // act
        const result = target.toHarRequest();

        // assert
        expect(result).toEqual({
          method: 'POST',
          url: 'https://example.com/',
          httpVersion: 'HTTP/0.9',
          headers: [{ name: 'content-type', value: 'text/plain' }],
          queryString: [],
          postData: {
            mimeType: 'text/plain',
            text: input.toString()
          },
          cookies: [],
          headersSize: -1,
          bodySize: -1
        });
      }
    );
  });
});
