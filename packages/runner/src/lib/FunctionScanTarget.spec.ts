import { FunctionScanTarget } from './FunctionScanTarget';
import supertest from 'supertest';

describe('FunctionScanTarget', () => {
  let functionScanTarget: FunctionScanTarget;

  beforeEach(() => {
    functionScanTarget = new FunctionScanTarget();
  });

  afterEach(async () => {
    await functionScanTarget.stop();
  });

  describe('start method', () => {
    it('should return server URL', async () => {
      const result = await functionScanTarget.start(jest.fn());
      expect(result.url).toBeDefined();
    });
  });

  describe('request handling', () => {
    it('should handle successful requests', async () => {
      const input = 'some_input';
      const mockFn = jest.fn().mockResolvedValue('result');
      const { url } = await functionScanTarget.start(mockFn);

      const response = await supertest(url)
        .post('/')
        .set('Content-Type', 'text/plain')
        .send(input)
        .expect(200);

      expect(mockFn).toHaveBeenCalledWith(input);
      expect(response.text).toBe('result');
    });

    it('should handle json payloads', async () => {
      const input = { a: 42 };
      const mockFn = jest.fn().mockResolvedValue('result');
      const { url } = await functionScanTarget.start(mockFn);

      const response = await supertest(url)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(input))
        .expect(200);

      expect(mockFn).toHaveBeenCalledWith(input);
      expect(response.text).toBe('result');
    });

    it('should handle failed requests', async () => {
      const input = 'some_input';
      const mockError = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      const { url } = await functionScanTarget.start(mockFn);

      const response = await supertest(url)
        .post('/')
        .set('Content-Type', 'text/plain')
        .send(input)
        .expect(500);

      expect(mockFn).toHaveBeenCalledWith(input);
      expect(response.body).toEqual({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Test error'
      });
    });
  });

  describe('stop method', () => {
    it('should stop the server', async () => {
      const { url } = await functionScanTarget.start(jest.fn());
      await functionScanTarget.stop();

      let connectionRefused = false;
      try {
        await supertest(url)
          .post('/')
          .set('Content-Type', 'application/json')
          .send({});
      } catch (error) {
        connectionRefused = error.code === 'ECONNREFUSED';
      } finally {
        expect(connectionRefused).toBeTruthy();
      }
    });
  });
});
