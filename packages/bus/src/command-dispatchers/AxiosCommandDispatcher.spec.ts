import { HttpCommand } from './HttpCommand';
import { AxiosCommandDispatcher } from './AxiosCommandDispatcher';
import { HttpCommandDispatcherConfig } from './HttpCommandDispatcherConfig';
import { RateLimitedAxiosInstance } from 'axios-rate-limit';
import {
  anything,
  deepEqual,
  instance,
  mock,
  reset,
  verify,
  when
} from 'ts-mockito';
import { AxiosResponse, Method } from 'axios';

class ConcreteCommand extends HttpCommand<string, string | undefined> {
  constructor(
    payload: string,
    url: string,
    method: Method,
    expectReply?: boolean,
    ttl?: number
  ) {
    super(payload, url, method, expectReply, ttl);
  }
}

describe('AxiosCommandDispatcher', () => {
  const mockedAxiosRateLimit = jest.fn();
  const mockedRateLimitedAxiosInstance = mock<RateLimitedAxiosInstance>();
  const options: HttpCommandDispatcherConfig = {
    url: 'https://example.com'
  };

  let axiosDispatcher: AxiosCommandDispatcher;

  beforeEach(() => {
    jest.mock('axios-rate-limit', () =>
      mockedAxiosRateLimit.mockImplementation(() =>
        instance(mockedRateLimitedAxiosInstance)
      )
    );

    axiosDispatcher = new AxiosCommandDispatcher(options);
  });

  afterEach(() => {
    reset<RateLimitedAxiosInstance>(mockedRateLimitedAxiosInstance);

    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('init', () => {
    it('should create axios', async () => {
      await axiosDispatcher.init?.();

      expect(mockedAxiosRateLimit).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute', () => {
    it('should throw an error if client is not initialized yet', async () => {
      const command = new ConcreteCommand('test', '/api/test', 'POST');

      const result = axiosDispatcher.execute(command);

      await expect(result).rejects.toThrow(
        'established a connection with host'
      );
    });

    it('should send message', async () => {
      const command = new ConcreteCommand('test', '/api/test', 'POST', false);
      when(mockedRateLimitedAxiosInstance.request(anything())).thenResolve();
      await axiosDispatcher.init?.();

      await axiosDispatcher.execute(command);

      verify(
        mockedRateLimitedAxiosInstance.request(
          deepEqual({
            url: command.url,
            method: command.method,
            data: command.payload,
            timeout: command.ttl
          })
        )
      ).once();
    });

    it('should send message and get reply', async () => {
      const command = new ConcreteCommand('test', '/api/test', 'POST', true);
      const response: AxiosResponse = {
        config: {},
        headers: {},
        status: 200,
        statusText: 'OK',
        data: 'result'
      };
      when(mockedRateLimitedAxiosInstance.request(anything())).thenResolve(
        response
      );
      await axiosDispatcher.init?.();

      const result = await axiosDispatcher.execute(command);

      expect(result).toEqual(response.data);
      verify(
        mockedRateLimitedAxiosInstance.request(
          deepEqual({
            url: command.url,
            method: command.method,
            data: command.payload,
            timeout: command.ttl
          })
        )
      ).once();
    });

    it('should throw a error if no response', async () => {
      const command = new ConcreteCommand('test', '/api/test', 'POST', true, 1);
      await axiosDispatcher.init?.();

      const result = axiosDispatcher.execute(command);
      verify(
        mockedRateLimitedAxiosInstance.request(
          deepEqual({
            url: command.url,
            method: command.method,
            data: command.payload,
            timeout: command.ttl
          })
        )
      ).once();

      await expect(result).rejects.toThrow();
    });
  });
});
