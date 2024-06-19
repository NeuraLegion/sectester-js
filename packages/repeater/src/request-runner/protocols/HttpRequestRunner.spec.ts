import 'reflect-metadata';
import { HttpRequestRunner } from './HttpRequestRunner';
import { Protocol } from '../../models/Protocol';
import { Request, RequestOptions } from '../Request';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { ProxyFactory } from '../../utils';
import { Logger } from '@sectester/core';
import nock from 'nock';
import { anything, instance, mock, reset, spy, verify, when } from 'ts-mockito';
import { promisify } from 'node:util';
import {
  brotliCompress,
  constants,
  gzip,
  deflate,
  deflateRaw
} from 'node:zlib';

const createRequest = (options?: Partial<RequestOptions>) => {
  const requestOptions = {
    url: 'https://foo.bar',
    headers: {},
    protocol: Protocol.HTTP,
    ...options
  };
  const request = new Request(requestOptions);
  const spiedRequest = spy(request);
  when(spiedRequest.method).thenReturn('GET');

  return { requestOptions, request, spiedRequest };
};

describe('HttpRequestRunner', () => {
  const loggerMock = mock<Logger>();
  const proxyFactoryMock = mock<ProxyFactory>();
  let spiedRunnerOptions!: RequestRunnerOptions;

  let sut!: HttpRequestRunner;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  afterAll(() => nock.enableNetConnect());

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }

    const RunnerOptions: RequestRunnerOptions = {};
    spiedRunnerOptions = spy(RunnerOptions);

    sut = new HttpRequestRunner(
      instance(loggerMock),
      instance(proxyFactoryMock),
      RunnerOptions
    );
  });

  afterEach(() => {
    nock.cleanAll();
    nock.restore();

    reset<Logger | RequestRunnerOptions | ProxyFactory>(
      loggerMock,
      spiedRunnerOptions,
      proxyFactoryMock
    );
  });

  describe('protocol', () => {
    it('should return HTTP', () => {
      const protocol = sut.protocol;
      expect(protocol).toBe(Protocol.HTTP);
    });
  });

  describe('run', () => {
    it('should call setHeaders on the provided request if additional headers were configured globally', async () => {
      const headers = { testHeader: 'test-header-value' };
      when(spiedRunnerOptions.headers).thenReturn(headers);
      const { request, spiedRequest } = createRequest();

      await sut.run(request);

      verify(spiedRequest.setHeaders(headers)).once();
    });

    it('should not call setHeaders on the provided request if there were no additional headers configured', async () => {
      const { request, spiedRequest } = createRequest();

      await sut.run(request);

      verify(spiedRequest.setHeaders(anything())).never();
    });

    it('should perform an external http request', async () => {
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(200, {});

      const response = await sut.run(request);

      expect(response).toMatchObject({
        statusCode: 200,
        body: '{}'
      });
    });

    it('should handle HTTP errors', async () => {
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(500, {});

      const response = await sut.run(request);

      expect(response).toMatchObject({
        statusCode: 500,
        body: '{}'
      });
    });

    it('should preserve directory traversal', async () => {
      const path = 'public/../../../../../../etc/passwd';
      const { request } = createRequest({
        url: `http://localhost:8080/${path}`
      });
      nock('http://localhost:8080').get(`/${path}`).reply(200, {});

      const response = await sut.run(request);

      expect(response).toMatchObject({
        statusCode: 200,
        body: {}
      });
    });

    it('should handle timeout', async () => {
      when(spiedRunnerOptions.timeout).thenReturn(1);
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').delayBody(2).reply(204);

      const response = await sut.run(request);

      expect(response).toMatchObject({
        errorCode: 'Error',
        message: 'Waiting response has timed out'
      });
    });

    it('should handle non-HTTP errors', async () => {
      const { request } = createRequest();

      const response = await sut.run(request);

      expect(response).toMatchObject({
        statusCode: undefined
      });
    });

    it('should truncate response body with not white-listed mime type', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url)
        .get('/')
        .reply(200, bigBody, { 'content-type': 'application/x-custom' });

      const response = await sut.run(request);

      expect(response.body?.length).toEqual(1024);
      expect(response.body).toEqual(bigBody.slice(0, 1024));
    });

    it('should not truncate response body if it is in allowed mime types', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn([
        'application/x-custom'
      ]);
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-custom'
      });

      const response = await sut.run(request);

      expect(response.body).toEqual(bigBody);
    });

    it('should decode response body if content-encoding is brotli', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn(['text/plain']);
      const { request, requestOptions } = createRequest();
      const expected = 'x'.repeat(1025);
      const bigBody = await promisify(brotliCompress)(expected);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'text/plain',
        'content-encoding': 'br'
      });

      const response = await sut.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should prevent decoding response body if decompress option is disabled', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn(['text/plain']);
      const { request, requestOptions } = createRequest({
        decompress: false,
        encoding: 'base64'
      });
      const expected = 'x'.repeat(100);
      const body = await promisify(gzip)(expected, {
        flush: constants.Z_SYNC_FLUSH,
        finishFlush: constants.Z_SYNC_FLUSH
      });
      nock(requestOptions.url).get('/').reply(200, body, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip'
      });

      const response = await sut.run(request);

      expect(response.body).toEqual(body.toString('base64'));
      expect(response.headers).toMatchObject({ 'content-encoding': 'gzip' });
    });

    it('should decode response body if content-encoding is gzip', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn(['text/plain']);
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

      const response = await sut.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should decode response body if content-encoding is deflate', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn(['text/plain']);
      const { request, requestOptions } = createRequest();
      const expected = 'x'.repeat(1025);
      const bigBody = await promisify(deflate)(expected, {
        flush: constants.Z_SYNC_FLUSH,
        finishFlush: constants.Z_SYNC_FLUSH
      });
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'text/plain',
        'content-encoding': 'deflate'
      });

      const response = await sut.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should decode response body if content-encoding is deflate and content does not have zlib headers', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn(['text/plain']);
      const { request, requestOptions } = createRequest();
      const expected = 'x'.repeat(1025);
      const bigBody = await promisify(deflateRaw)(expected, {
        flush: constants.Z_SYNC_FLUSH,
        finishFlush: constants.Z_SYNC_FLUSH
      });
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'text/plain',
        'content-encoding': 'deflate'
      });

      const response = await sut.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should decode and truncate gzipped response body if content-type is not in allowed list', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn(['text/plain']);
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

      const response = await sut.run(request);

      expect(response.body).toEqual(expected);
    });

    it('should not truncate response body if allowed mime type starts with actual one', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      when(spiedRunnerOptions.allowedMimes).thenReturn([
        'application/x-custom'
      ]);
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-custom-with-suffix'
      });

      const response = await sut.run(request);

      expect(response.body).toEqual(bigBody);
    });

    it('should skip truncate on 204 response status', async () => {
      when(spiedRunnerOptions.maxContentLength).thenReturn(1);
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(204);
      const response = await sut.run(request);

      expect(response.body).toEqual('');
    });
  });
});
