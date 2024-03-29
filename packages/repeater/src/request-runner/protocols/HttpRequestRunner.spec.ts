import { HttpRequestRunner } from './HttpRequestRunner';
import { Request, RequestOptions } from '../Request';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Protocol } from '../../models';
import nock from 'nock';
import 'reflect-metadata';
import { anything, spy, verify, when } from 'ts-mockito';
import { Logger, LogLevel } from '@sectester/core';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { brotliCompress, constants, gzip } from 'zlib';
import { promisify } from 'util';

const createRequest = (options: Partial<RequestOptions> = {}) => {
  const requestOptions = {
    protocol: Protocol.HTTP,
    url: 'https://foo.bar',
    method: 'GET',
    ...options
  };
  const request = new Request(requestOptions);
  const spiedRequest = spy(request);
  when(spiedRequest.method).thenReturn('GET');

  return { requestOptions, request, spiedRequest };
};

describe('HttpRequestRunner', () => {
  const setupRunner = (
    options: RequestRunnerOptions = {},
    logger: Logger = new Logger()
  ): HttpRequestRunner => new HttpRequestRunner(options, logger);

  beforeAll(() => nock.disableNetConnect());
  afterAll(() => nock.enableNetConnect());

  afterEach(() => {
    nock.cleanAll();
    nock.restore();
  });

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }
  });

  describe('protocol', () => {
    const runner = setupRunner();
    it('should return HTTP', () => expect(runner.protocol).toBe(Protocol.HTTP));
  });

  describe('run', () => {
    it('should call setHeaders on the provided request if additional headers were configured globally', async () => {
      const headers = { testHeader: 'test-header-value' };
      const runner = setupRunner({ headers });
      const { request, spiedRequest } = createRequest();
      nock('https://foo.bar').get('/').reply(200, {});

      await runner.run(request);

      verify(spiedRequest.setHeaders(headers)).once();
    });

    it('should not call setHeaders on the provided request if there were no additional headers configured', async () => {
      const runner = setupRunner();
      const { request, spiedRequest } = createRequest();
      nock('https://foo.bar').get('/').reply(200, {});

      await runner.run(request);

      verify(spiedRequest.setHeaders(anything())).never();
    });

    it('should perform an external http request', async () => {
      const runner = setupRunner();
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(200, {});

      const response = await runner.run(request);

      expect(response).toMatchObject({
        statusCode: 200,
        body: {}
      });
    });

    it('should preserve directory traversal', async () => {
      const runner = setupRunner();
      const path = 'public/../../../../../../etc/passwd';
      const { request } = createRequest({
        url: `http://localhost:8080/${path}`
      });
      nock('http://localhost:8080').get(`/${path}`).reply(200, {});

      const response = await runner.run(request);

      expect(response).toMatchObject({
        statusCode: 200,
        body: {}
      });
    });

    it('should handle HTTP errors', async () => {
      const runner = setupRunner();
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(500, {});

      const response = await runner.run(request);

      expect(response).toMatchObject({
        statusCode: 500,
        body: {}
      });
    });

    it('should handle timeout', async () => {
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').delayBody(2).reply(204);
      const runner = setupRunner({ timeout: 1 });

      const response = await runner.run(request);

      expect(response).toMatchObject({
        errorCode: 'Error',
        message: 'This operation was aborted'
      });
    });

    it('should handle non-HTTP errors', async () => {
      const runner = setupRunner({}, new Logger(LogLevel.SILENT));
      const { request } = createRequest();

      const response = await runner.run(request);

      expect(response.statusCode).toBeUndefined();
    });

    it('should truncate response body with not white-listed mime type', async () => {
      const runner = setupRunner({
        maxContentLength: 1
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url)
        .get('/')
        .reply(200, bigBody, { 'content-type': 'application/x-custom' });

      const response = await runner.run(request);

      expect(response.body).toEqual(bigBody.slice(0, 1024));
    });

    it('should not truncate response body if it is in allowed mime types', async () => {
      const runner = setupRunner({
        maxContentLength: 1,
        allowedMimes: ['application/x-custom']
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-custom'
      });

      const response = await runner.run(request);

      expect(response.body).toEqual(bigBody);
    });

    it('should decode response body if content-encoding is gzip', async () => {
      const runner = setupRunner({
        maxContentLength: 1,
        allowedMimes: ['text/plain']
      });
      const { request, requestOptions } = createRequest();
      const expected = 'x'.repeat(1025);
      const bigBody = await promisify(gzip)(expected, {
        flush: constants.Z_SYNC_FLUSH,
        finishFlush: constants.Z_SYNC_FLUSH
      });
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip'
      });

      const response = await runner.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should decode response body if content-encoding is brotli', async () => {
      const runner = setupRunner({
        maxContentLength: 1,
        allowedMimes: ['text/plain']
      });
      const { request, requestOptions } = createRequest();
      const expected = 'x'.repeat(1025);
      const bigBody = await promisify(brotliCompress)(expected);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'text/plain',
        'content-encoding': 'br'
      });

      const response = await runner.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should decode and truncate gzipped response body if content-type is not in allowed list', async () => {
      const runner = setupRunner({
        maxContentLength: 1,
        allowedMimes: ['text/plain']
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      const expected = bigBody.slice(0, 1024);
      const gzippedBody = await promisify(gzip)(bigBody, {
        flush: constants.Z_SYNC_FLUSH,
        finishFlush: constants.Z_SYNC_FLUSH
      });
      nock(requestOptions.url).get('/').reply(200, gzippedBody, {
        'content-type': 'text/html',
        'content-encoding': 'gzip'
      });

      const response = await runner.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should not truncate response body if allowed mime type starts with actual one', async () => {
      const runner = setupRunner({
        maxContentLength: 1,
        allowedMimes: ['application/x-custom']
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-custom-with-suffix'
      });

      const response = await runner.run(request);

      expect(response.body).toEqual(bigBody);
    });

    it('should skip truncate on 204 response status', async () => {
      const runner = setupRunner({
        maxContentLength: 1
      });
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(204);
      const response = await runner.run(request);

      expect(response.body).toEqual('');
    });

    it('should use SocksProxyAgent if socks proxyUrl provided', async () => {
      const runner = setupRunner({
        proxyUrl: 'socks://proxy.baz'
      });
      const { request, requestOptions } = createRequest();
      const scope = nock(requestOptions.url).get('/').reply(200, 'Dummy');

      scope.on('request', req =>
        expect(req.options.agent).toBeInstanceOf(SocksProxyAgent)
      );

      await runner.run(request);
    });

    it('should use keepAlive agent on if reuseConnection enabled', async () => {
      const runner = setupRunner({
        reuseConnection: true
      });
      const { request, requestOptions } = createRequest();
      const scope = nock(requestOptions.url).get('/').reply(200, 'Dummy');

      scope.on('request', req => {
        expect(req.options.agent.options.keepAlive).toBeTruthy();
      });

      await runner.run(request);
    });
  });
});
