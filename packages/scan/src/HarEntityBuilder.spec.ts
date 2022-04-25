import { HarEntryBuilder } from './HarEntryBuilder';
import FormData from 'form-data';

describe('HarEntityBuilder', () => {
  describe('constructor', () => {
    it('should create with default method if method is not passed', () => {
      const entryBuilder = new HarEntryBuilder('https://example.com');

      expect(entryBuilder).toMatchObject({ method: 'GET' });
    });

    it('should throw if ulr is not passed', () => {
      expect(() => new HarEntryBuilder('')).toThrow('Please provide `url`.');
    });
  });

  describe('setQuery', () => {
    it('should set query if passed string', () => {
      const testQuery = 'parameter=value';
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.setQuery(testQuery);

      expect(entryBuilder).toMatchObject({ query: testQuery });
    });

    it('should set query if passed URLSearchParams', () => {
      const testQuery = new URLSearchParams();
      testQuery.append('parameter', 'value');
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.setQuery(testQuery);

      expect(entryBuilder).toMatchObject({ query: testQuery.toString() });
    });

    it('should set query if passed object', () => {
      const testQuery = { parameter: 'value' };
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.setQuery(testQuery);

      expect(entryBuilder).toMatchObject({ query: 'parameter=value' });
    });
  });

  describe('setHeaders', () => {
    it('should set header if object passed', () => {
      const headers = { 'Content-Type': 'application/json' };
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.setHeaders(headers);

      expect(entryBuilder).toMatchObject({
        headers: [{ name: 'Content-Type', value: 'application/json' }]
      });
    });
  });

  describe('postData', () => {
    it('should set body if FormData passed', () => {
      const data = new FormData();
      data.append('parameter', 'value');
      const entryBuilder = new HarEntryBuilder('https://exampple.com');

      entryBuilder.postData(data);

      const body = data.getBuffer().toString();
      const headers = Object.entries(data.getHeaders()).map(
        ([key, value]: [string, string]) => ({
          name: key,
          value
        })
      );
      expect(entryBuilder).toMatchObject({ headers, body });
    });

    it('should set body if URLSearchParams passed', () => {
      const data = new URLSearchParams();
      data.append('parameter', 'value');
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.postData(data);

      expect(entryBuilder).toMatchObject({ body: data.toString() });
    });

    it('should set body if string passed', () => {
      const data = 'parameter=value';
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.postData(data);

      expect(entryBuilder).toMatchObject({ body: data });
    });

    it('should set body if object passed', () => {
      const data = { parameter: 'value' };
      const entryBuilder = new HarEntryBuilder('https://example.com');

      entryBuilder.postData(data);

      expect(entryBuilder).toMatchObject({ body: JSON.stringify(data) });
    });

    it(`shouldn't throw if passed undefined`, () => {
      const entryBuilder = new HarEntryBuilder('https://example.com');

      expect(() => entryBuilder.postData(undefined)).not.toThrow();
    });
  });

  describe('build', () => {
    it('should build correct entry', () => {
      const url = 'https://example.com';
      const query = 'parameter=value';
      const headers = { 'Content-Type': 'application/json' };
      const data = { test: 'test' };
      const entryBuilder = new HarEntryBuilder(url);
      entryBuilder.setQuery(query).setHeaders(headers).postData(data);

      const entry = entryBuilder.build();
      expect(entry).toMatchObject({
        request: {
          url: `${url}?${query}`,
          httpVersion: 'HTTP/1.1',
          method: 'GET',
          headers: [
            {
              name: 'Content-Type',
              value: 'application/json'
            }
          ],
          headersSize: -1,
          bodySize: -1,
          cookies: [],
          queryString: []
        },
        response: {
          httpVersion: 'HTTP/1.1',
          status: 200,
          statusText: 'Ok',
          headersSize: -1,
          bodySize: -1,
          content: '',
          redirectURL: '',
          cookies: [],
          headers: []
        },
        cache: {},
        time: 0,
        timings: {
          send: 0,
          receive: 0,
          wait: 0
        }
      });
    });
  });
});
