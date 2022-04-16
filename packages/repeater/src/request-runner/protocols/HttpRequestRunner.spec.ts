import { HttpRequestRunner } from './HttpRequestRunner';
import { Request, RequestOptions } from '../Request';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Protocol } from '../../models';
import nock from 'nock';
import 'reflect-metadata';
import { anything, spy, verify } from 'ts-mockito';
import { Logger, LogLevel } from '@secbox/core';

const createRequest = (options?: Partial<RequestOptions>) => {
  const requestOptions = {
    url: 'https://foo.bar',
    method: 'GET',
    headers: {},
    ...options
  };
  const request = new Request(requestOptions);
  const spiedRequest = spy(request);

  return { requestOptions, request, spiedRequest };
};

describe('HttpRequestRunner', () => {
  let runner!: HttpRequestRunner;

  const setupRunner = (options: RequestRunnerOptions = {}, logger?: Logger) => {
    runner = new HttpRequestRunner(options, logger);
  };

  describe('protocol', () => {
    setupRunner();
    it('should return HTTP', () => expect(runner.protocol).toBe(Protocol.HTTP));
  });

  describe('run', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should call setHeaders on the provided request if additional headers were configured globally', async () => {
      const headers = { testHeader: 'test-header-value' };
      setupRunner({ headers });
      const { request, spiedRequest } = createRequest();

      await runner.run(request);

      verify(spiedRequest.setHeaders(headers)).once();
    });

    it('should not call setHeaders on the provided request if there were no additional headers configured', async () => {
      setupRunner();
      const { request, spiedRequest } = createRequest();

      await runner.run(request);

      verify(spiedRequest.setHeaders(anything())).never();
    });

    it('should perform an external http request', async () => {
      setupRunner();
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(200, {});

      const response = await runner.run(request);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('{}');
    });

    it('should handle HTTP errors', async () => {
      setupRunner();
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(500, {});

      const response = await runner.run(request);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBe('{}');
    });

    it('should handle non-HTTP errors', async () => {
      setupRunner({}, new Logger(LogLevel.SILENT));
      const { request } = createRequest();

      const response = await runner.run(request);

      expect(typeof response.statusCode).toBe('undefined');
    });

    it('should truncate response body with not white-listed mime type', async () => {
      setupRunner({
        maxContentLength: 1
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url)
        .get('/')
        .reply(200, bigBody, { 'content-type': 'application/x-custom' });

      const response = await runner.run(request);

      expect(response.body?.length).toEqual(1024);
      expect(response.body).toEqual(bigBody.slice(0, 1024));
    });

    it('should not truncate response body if it is in whitelisted mime types', async () => {
      setupRunner({
        maxContentLength: 1,
        whitelistMimes: ['application/x-custom']
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-custom'
      });

      const response = await runner.run(request);

      expect(response.body?.length).toEqual(1025);
      expect(response.body).toEqual(bigBody);
    });

    it('should not truncate response body if whitelisted mime type starts with actual one', async () => {
      setupRunner({
        maxContentLength: 1,
        whitelistMimes: ['application/x-custom']
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-custom-with-suffix'
      });

      const response = await runner.run(request);

      expect(response.body?.length).toEqual(1025);
      expect(response.body).toEqual(bigBody);
    });

    it('should skip truncate on 204 response status', async () => {
      setupRunner({
        maxContentLength: 1
      });
      const { request, requestOptions } = createRequest();
      const bigBody = 'x'.repeat(1025);
      nock(requestOptions.url).get('/').reply(204, bigBody);

      const response = await runner.run(request);

      expect(response.body).toBeUndefined();
    });
  });
});
