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

    it('should set `queryString` from `URLSearchParams`', () => {
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

    it('should set `queryString` from `Record`', () => {
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

    it('should set `queryString` when passed via URL', () => {
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

    it('should set `queryString` with the same key', () => {
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

    it('should set `headers` with the same key', () => {
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

    it('should set `postData` from `FormData`', () => {
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

    it('should set `postData` from multipart/form-data', () => {
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

    it('should set `params` to undefined if boundary is not defined', () => {
      // arrange
      const value = Buffer.from([0x01, 0x09, 0x09, 0x04]);
      const form = new FormData();
      form.append('file', value, {
        filename: 'file.bin'
      });

      const target = new Target({
        url: 'https://example.com/',
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
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
            value: 'multipart/form-data'
          }
        ],
        queryString: [],
        postData: {
          mimeType: 'multipart/form-data',
          text: form.getBuffer().toString()
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it('should set `postData` from a plain object', () => {
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

    it('should set `postData` from JSON', () => {
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

    it('should recognize body as JSON by content-type (application/json-patch+json)', () => {
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

    it('should set `postData` from `URLSearchParams`', () => {
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

    it('should set `postData` from form-urlencoded', () => {
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

    it('should set `postData` to empty string', () => {
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
        postData: {
          mimeType: 'text/plain',
          text: ''
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });

    it.each([
      { input: 'text', type: 'String' },
      { input: 1, type: 'Number' },
      { input: false, type: 'Boolean' },
      { input: new Date(), type: 'Date' },
      { input: Buffer.from('text'), type: 'Buffer' }
    ])('should set `postData` from `$type`', ({ input }) => {
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
        headers: [],
        queryString: [],
        postData: {
          mimeType: 'text/plain',
          text: input.toString()
        },
        cookies: [],
        headersSize: -1,
        bodySize: -1
      });
    });
  });
});
