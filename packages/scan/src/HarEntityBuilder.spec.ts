import { HarEntryBuilder } from './HarEntryBuilder';
import FormData from 'form-data';

describe('HarEntityBuilder', () => {
  describe('constructor', () => {
    it('should create with default method if method is not passed', () => {
      const entryBuilder = new HarEntryBuilder('https://example.com');

      expect(entryBuilder).toMatchObject({ method: 'GET' });
    });

    it('should create with default method if incorect method is passed', () => {
      const entryBuilder = new HarEntryBuilder('https://example.com', 'www');

      expect(entryBuilder).toMatchObject({ method: 'GET' });
    });

    it('should normileze url', () => {
      const entryBuilder = new HarEntryBuilder('https://example.com/test');

      expect(entryBuilder).toMatchObject({ url: 'https://example.com' });
    });

    it('should add default schema if passed url without schema', () => {
      const entryBuilder = new HarEntryBuilder('example.com');

      expect(entryBuilder).toMatchObject({ url: 'https://example.com' });
    });

    it('should throw if ulr is not passed', () => {
      expect(() => new HarEntryBuilder('')).toThrow(
        `Please make sure that you pass correct 'url' option.`
      );
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

    it('should add query to already added query', () => {
      const testQuery = 'parameter2=value2';
      const entryBuilder = new HarEntryBuilder('https://example.com');
      entryBuilder.setQuery('parameter1=value1');

      entryBuilder.setQuery(testQuery);

      expect(entryBuilder).toMatchObject({
        query: 'parameter1=value1&parameter2=value2'
      });
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
      const passedHeaders = { 'Content-Type': 'application/json' };
      const data = { test: 'test' };
      const entryBuilder = new HarEntryBuilder(url);
      entryBuilder.setQuery(query).setHeaders(passedHeaders).postData(data);

      const entry = entryBuilder.build();

      const headers = [
        {
          name: 'Content-Type',
          value: 'application/json'
        }
      ];
      const queryString = [];
      for (const [name, value] of new URLSearchParams(query).entries()) {
        queryString.push({ name, value });
      }
      expect(entry).toMatchObject({
        request: {
          url: `${url}?${query}`,
          httpVersion: 'HTTP/1.1',
          method: 'GET',
          postData: JSON.stringify(data),
          headers,
          headersSize: Buffer.from(JSON.stringify(headers)).byteLength,
          bodySize: Buffer.from(JSON.stringify(data)).byteLength,
          cookies: [],
          queryString
        },
        response: {
          httpVersion: 'HTTP/1.1',
          status: 200,
          statusText: 'OK',
          headersSize: -1,
          bodySize: -1,
          content: {},
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
