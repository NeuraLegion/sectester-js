import { Request } from './Request';
import { Protocol } from '../models';

describe('Request', () => {
  describe('constructor', () => {
    it('should throw Error on empty url', () => {
      expect(
        () =>
          new Request({
            url: '',
            protocol: Protocol.HTTP
          })
      ).toThrow('Invalid URL.');
    });

    it('should throw Error on invalid url', () => {
      expect(
        () =>
          new Request({
            url: 'http::/foo.bar',
            protocol: Protocol.HTTP
          })
      ).toThrow('Invalid URL.');
    });

    it('should throw Error on invalid body', () => {
      expect(
        () =>
          new Request({
            url: 'http://foo.bar',
            body: 42 as unknown as string,
            protocol: Protocol.HTTP
          })
      ).toThrow('Body must be string.');
    });

    it('should throw Error on invalid correlationIdRegex', () => {
      expect(
        () =>
          new Request({
            url: 'http://foo.bar',
            correlationIdRegex: '(',
            protocol: Protocol.HTTP
          })
      ).toThrow('Correlation id must be regular expression.');
    });

    it('should create an instance', () => {
      expect(
        () =>
          new Request({
            url: 'http://foo.bar',
            protocol: Protocol.HTTP
          })
      ).not.toThrow();
    });
  });

  describe('method', () => {
    it('should normalize method', () => {
      expect(
        new Request({
          url: 'http://foo.bar',
          method: 'post',
          protocol: Protocol.HTTP
        }).method
      ).toBe('POST');
    });
  });

  describe('setHeaders', () => {
    it('should append headers', () => {
      const request = new Request({
        url: 'http://foo.bar',
        headers: { 'x-key': 'value' },
        protocol: Protocol.HTTP
      });

      request.setHeaders({ 'x-a1': 'a1', 'x-a2': 'a2' });

      expect(request.headers).toEqual({
        'x-key': 'value',
        'x-a1': 'a1',
        'x-a2': 'a2'
      });
    });
  });
});
