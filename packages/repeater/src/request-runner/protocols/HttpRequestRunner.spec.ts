import { HttpRequestRunner } from './HttpRequestRunner';
import { Request, RequestOptions } from '../Request';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Protocol } from '../../models';
import nock from 'nock';
import 'reflect-metadata';
import { anything, reset, spy, verify, when } from 'ts-mockito';

const createRequest = (options?: Partial<RequestOptions>) => {
  const requestOptions = { url: 'https://foo.bar', headers: {}, ...options };
  const request = new Request(requestOptions);
  const spiedRequest = spy(request);
  when(spiedRequest.method).thenReturn('GET');

  return { requestOptions, request, spiedRequest };
};

describe('HttpRequestRunner', () => {
  const executorOptions: RequestRunnerOptions = {};
  const spiedExecutorOptions = spy(executorOptions);

  let runner!: HttpRequestRunner;

  beforeEach(() => {
    runner = new HttpRequestRunner(executorOptions);
  });

  afterEach(() => reset<RequestRunnerOptions>(spiedExecutorOptions));

  describe('protocol', () => {
    it('should return HTTP', () => expect(runner.protocol).toBe(Protocol.HTTP));
  });

  describe('run', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should call setHeaders on the provided request if additional headers were configured globally', async () => {
      const headers = { testHeader: 'test-header-value' };
      when(spiedExecutorOptions.headers).thenReturn(headers);
      const { request, spiedRequest } = createRequest();

      await runner.run(request);

      verify(spiedRequest.setHeaders(headers)).once();
    });

    it('should not call setHeaders on the provided request if there were no additional headers configured', async () => {
      const { request, spiedRequest } = createRequest();

      await runner.run(request);

      verify(spiedRequest.setHeaders(anything())).never();
    });

    it('should perform an external http request', async () => {
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(200, {});

      const response = await runner.run(request);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('{}');
    });

    it('should handle HTTP errors', async () => {
      const { request, requestOptions } = createRequest();
      nock(requestOptions.url).get('/').reply(500, {});

      const response = await runner.run(request);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBe('{}');
    });

    it('should handle non-HTTP errors', async () => {
      const { request } = createRequest();

      const response = await runner.run(request);

      expect(typeof response.statusCode).toBe('undefined');
    });

    it('should not truncate response body if it is in whitelisted mime types', async () => {
      when(spiedExecutorOptions.maxContentLength).thenReturn(100);
      const { request, requestOptions } = createRequest();
      const bigBody = 'Too big body'.repeat(10000);
      nock(requestOptions.url).get('/').reply(200, bigBody, {
        'content-type': 'application/x-javascript'
      });

      const response = await runner.run(request);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(bigBody);
    });
  });
});
