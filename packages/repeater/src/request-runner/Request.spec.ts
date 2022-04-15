import { Request } from './Request';

describe('Request', () => {
  it('should normalize method', () => {
    expect(
      new Request({
        url: 'http://foo.bar',
        method: 'post'
      }).method
    ).toBe('POST');
  });

  it('should normalize url', () => {
    expect(
      new Request({
        url: 'HTTP://foo.BAR',
        method: 'post'
      }).url
    ).toBe('http://foo.bar/');
  });

  it('should throw Error on empty url', () => {
    expect(
      () =>
        new Request({
          url: ''
        })
    ).toThrow('Url must be declared explicitly.');
  });

  it('should append headers', () => {
    const request = new Request({
      url: 'http://foo.bar',
      headers: { 'x-key': 'value' }
    });

    request.setHeaders({ 'x-a1': 'a1', 'x-a2': 'a2' });

    expect(request.headers).toEqual({
      'x-key': 'value',
      'x-a1': 'a1',
      'x-a2': 'a2'
    });
  });

  it('should throw Error on invalid url', () => {
    expect(
      () =>
        new Request({
          url: 'http::/foo.bar'
        })
    ).toThrow('Invalid URL.');
  });

  it('should throw Error on invalid body', () => {
    expect(
      () =>
        new Request({
          url: 'http://foo.bar',
          body: 42 as unknown as string
        })
    ).toThrow('Body must be string.');
  });

  it('should throw Error on invalid correlationIdRegex', () => {
    expect(
      () =>
        new Request({
          url: 'http://foo.bar',
          correlationIdRegex: '('
        })
    ).toThrow('Correlation id must be regular expression.');
  });
});
