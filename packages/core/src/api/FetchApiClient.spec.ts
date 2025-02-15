import { FetchApiClient } from './FetchApiClient';
import { ApiError } from '../exceptions/ApiError';
import { RateLimitError } from '../exceptions/RateLimitError';
import nock from 'nock';

describe('FetchApiClient', () => {
  const config = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
    timeout: 5000
  };

  let sut: FetchApiClient;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  beforeEach(() => {
    if (nock.isActive()) {
      nock.restore();
    }
    sut = new FetchApiClient(config);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.restore();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const expectedResponse = { data: 'test' };
      nock(config.baseUrl).get('/test').reply(200, expectedResponse);

      const response = await sut.request('/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(expectedResponse);
    });

    it('should include authorization header', async () => {
      nock(config.baseUrl)
        .get('/test')
        .matchHeader('authorization', `Api-Key ${config.apiKey}`)
        .reply(200);

      const response = await sut.request('/test');

      expect(response.status).toBe(200);
    });

    it('should use custom api key prefix', async () => {
      const customClient = new FetchApiClient({
        ...config,
        apiKeyPrefix: 'Bearer'
      });

      nock(config.baseUrl)
        .get('/test')
        .matchHeader('authorization', `Bearer ${config.apiKey}`)
        .reply(200);

      const response = await customClient.request('/test');

      expect(response.status).toBe(200);
    });

    it('should handle timeout', async () => {
      nock(config.baseUrl).get('/test').delay(2000).reply(200);

      const clientWithShortTimeout = new FetchApiClient({
        ...config,
        timeout: 100
      });

      await expect(clientWithShortTimeout.request('/test')).rejects.toThrow(
        'TimeoutError'
      );
    });

    it('should retry on 5xx errors', async () => {
      nock(config.baseUrl)
        .get('/test')
        .reply(503)
        .get('/test')
        .reply(200, { success: true });

      const response = await sut.request('/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('should not retry on non-idempotent methods', async () => {
      nock(config.baseUrl).post('/test').reply(503);

      await expect(sut.request('/test', { method: 'POST' })).rejects.toThrow(
        ApiError
      );
    });

    it('should handle rate limiting with retry-after', async () => {
      nock(config.baseUrl)
        .get('/test')
        .reply(429, '', {
          'Retry-After': '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'RateLimit': 'limit=100,remaining=0,reset=1'
        })
        .get('/test')
        .reply(200, { success: true });

      const response = await sut.request('/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('should throw RateLimitError on rate limit exceeded', async () => {
      nock(config.baseUrl).get('/test').reply(429, '', {
        'Retry-After': '30',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'RateLimit': 'limit=100,remaining=0,reset=30'
      });

      await expect(sut.request('/test')).rejects.toThrow(RateLimitError);
    });

    it('should handle redirect on 409 with location header', async () => {
      nock(config.baseUrl)
        .get('/test')
        .reply(409, '', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Location: '/new-location'
        })
        .get('/new-location')
        .reply(200, { success: true });

      const response = await sut.request('/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('should handle absolute URLs in location header', async () => {
      nock(config.baseUrl)
        .get('/test')
        .reply(409, '', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Location: 'https://api.example.com/new-location'
        })
        .get('/new-location')
        .reply(200, { success: true });

      const response = await sut.request('/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('should throw ApiError on non-retryable error status', async () => {
      nock(config.baseUrl).get('/test').reply(400, { error: 'Bad Request' });

      await expect(sut.request('/test')).rejects.toThrow(ApiError);
    });

    it('should respect custom request options', async () => {
      const customHeaders = { 'X-Custom-Header': 'test-value' };
      nock(config.baseUrl)
        .get('/test')
        .matchHeader('x-custom-header', 'test-value')
        .reply(200);

      const response = await sut.request('/test', {
        headers: customHeaders
      });

      expect(response.status).toBe(200);
    });

    it('should handle network errors with retry', async () => {
      nock(config.baseUrl)
        .get('/test')
        .replyWithError({ code: 'ECONNRESET' })
        .get('/test')
        .reply(200, { success: true });

      const response = await sut.request('/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('should respect max retry attempts', async () => {
      nock(config.baseUrl).get('/test').times(4).reply(503);

      await expect(sut.request('/test')).rejects.toThrow(ApiError);
    });
  });
});
