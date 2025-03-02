import { HttpMethod } from '../models';
import { Target, TargetOptions } from './Target';

describe('Target', () => {
  describe('constructor', () => {
    it('should create a target with default values', () => {
      const target = new Target({
        url: 'https://example.com?search=something#foo'
      });
      expect(target.url).toBe('https://example.com/?search=something#foo');
      expect(target.method).toBe(HttpMethod.GET);
      expect(target.headers).toEqual({});
      expect(target.body).toBeUndefined();
      expect(target.queryString).toBe('search=something');
      expect(target.fragment).toBe('#foo');
    });

    it('should throw error when request body is not allowed', () => {
      expect(
        () => new Target({ url: 'https://example.com', body: 'body' })
      ).toThrow('Cannot set body for GET or HEAD requests');
    });

    it('should create a target with custom values', () => {
      const options: TargetOptions = {
        url: 'https://example.com/api',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        body: { key: 'value' },
        query: { param: 'value' }
      };
      const target = new Target(options);
      expect(target.url).toBe('https://example.com/api?param=value');
      expect(target.method).toBe(HttpMethod.POST);
      expect(target.headers).toEqual({ 'content-type': 'application/json' });
      expect(target.body).toEqual({ key: 'value' });
    });

    it.each([
      { data: { key: 'value' }, name: 'object', expected: 'application/json' },
      { data: [{ key: 'value' }], name: 'array', expected: 'application/json' },
      { data: 'text body', name: 'string', expected: 'text/plain' },
      { data: 123, name: 'number', expected: undefined },
      { data: null, name: 'null', expected: 'text/plain' },
      {
        data: new Blob(['blob content']),
        name: 'Blob',
        expected: 'application/octet-stream'
      },
      {
        data: new URLSearchParams({ key: 'value' }),
        name: 'URLSearchParams',
        expected: 'application/x-www-form-urlencoded'
      }
    ])('should guess content type from body: $name', ({ data, expected }) => {
      const target = new Target({
        body: data,
        url: 'https://example.com',
        method: HttpMethod.POST
      });
      expect(target.headers).toEqual({ 'content-type': expected });
    });

    it('should normalize URL', () => {
      const target = new Target({ url: 'example.com' });
      expect(target.url).toBe('https://example.com/');
    });

    it('should handle string method that is not HttpMethod', () => {
      const target = new Target({
        url: 'https://example.com',
        method: 'CUSTOM'
      });
      expect(target.method).toBe(HttpMethod.GET);
    });
  });

  describe('parsedURL', () => {
    it('should return URL object', () => {
      const target = new Target({ url: 'https://example.com' });
      expect(target.parsedURL instanceof URL).toBeTruthy();
      expect(target.parsedURL.href).toBe('https://example.com/');
    });
  });

  describe('query', () => {
    it('should handle query parameters as object', () => {
      const target = new Target({
        url: 'https://example.com',
        query: { param1: 'value1', param2: 'value2' }
      });
      expect(target.url).toBe(
        'https://example.com/?param1=value1&param2=value2'
      );
      expect(target.queryString).toBe('param1=value1&param2=value2');
    });

    it('should preserve query parameters from URL', () => {
      const target = new Target({ url: 'https://example.com?existing=param' });
      expect(target.url).toBe('https://example.com/?existing=param');
      expect(target.queryString).toBe('existing=param');
    });

    it('should override URL query parameters with query option', () => {
      const target = new Target({
        url: 'https://example.com?old=param',
        query: { new: 'param' }
      });
      expect(target.url).toBe('https://example.com/?new=param');
      expect(target.queryString).toBe('new=param');
    });

    it('should handle custom query serializer', () => {
      const customSerializer = (params: Record<string, string>) =>
        Object.entries(params)
          .map(([key, value]: [string, string]) => `${key}:${value}`)
          .join(';');

      const target = new Target({
        url: 'https://example.com',
        query: { param1: 'value1', param2: 'value2' },
        serializeQuery: customSerializer
      });

      expect(target.queryString).toBe('param1:value1;param2:value2');
      expect(target.url).toBe(
        'https://example.com/?param1:value1;param2:value2'
      );
    });
  });

  describe('body', () => {
    it('should handle string body', async () => {
      const target = new Target({
        url: 'https://example.com',
        body: 'text body',
        method: HttpMethod.POST
      });
      expect(target.body).toBe('text body');
      await expect(target.text()).resolves.toBe('text body');
    });

    it('should handle object body', async () => {
      const body = { key: 'value' };
      const target = new Target({
        body,
        method: HttpMethod.POST,
        url: 'https://example.com'
      });
      expect(target.body).toBe(body);
      await expect(target.text()).resolves.toBe(JSON.stringify(body));
    });

    it('should handle undefined body', async () => {
      const target = new Target({ url: 'https://example.com' });
      expect(target.body).toBeUndefined();
      await expect(target.text()).resolves.toBeUndefined();
    });
  });

  describe('headers', () => {
    it('should return empty object when headers not set', () => {
      const target = new Target({ url: 'https://example.com' });
      expect(target.headers).toEqual({});
    });

    it('should return headers when set', () => {
      const headers = { 'content-type': 'application/json', 'x-test': 'value' };
      const target = new Target({
        headers,
        url: 'https://example.com'
      });
      expect(target.headers).toEqual(headers);
    });
  });
});
