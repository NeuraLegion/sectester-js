import { HttpCommandDispatcherConfig } from './HttpCommandDispatcherConfig';
import { HttpRequest } from '../commands';
import { HttpCommandError } from '../exceptions';
import { CommandDispatcher, Logger, RetryStrategy } from '@sectester/core';
import { inject, injectable } from 'tsyringe';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import rateLimit, { RateLimitedAxiosInstance } from 'axios-rate-limit';
import FormData from 'form-data';
import { finished, Readable } from 'stream';
import { promisify } from 'util';

@injectable()
export class HttpCommandDispatcher implements CommandDispatcher {
  private readonly client: RateLimitedAxiosInstance;

  constructor(
    private readonly logger: Logger,
    @inject(RetryStrategy)
    private readonly retryStrategy: RetryStrategy,
    @inject(HttpCommandDispatcherConfig)
    private readonly options: HttpCommandDispatcherConfig
  ) {
    this.client = this.createHttpClient();
  }

  public async execute<T, R>(
    command: HttpRequest<T, R>
  ): Promise<R | undefined> {
    this.logger.debug(
      'Executing an incoming command (%s): %j',
      command.correlationId,
      command
    );
    const response = await this.retryStrategy.acquire(() =>
      this.performHttpRequest(command)
    );

    if (!command.expectReply && response.data instanceof Readable) {
      // drain readable stream to avoid memory leaks
      response.data.on('readable', response.data.read.bind(response.data));
      await promisify(finished)(response.data);
    } else {
      this.logger.debug(
        'Received a response to the command (%s): %j',
        command.correlationId,
        response.data
      );

      return response.data;
    }
  }

  private async performHttpRequest<T, R>({
    correlationId,
    createdAt,
    expectReply,
    method,
    params,
    payload,
    ttl,
    url
  }: HttpRequest<T, R>): Promise<AxiosResponse<R>> {
    try {
      return await this.client.request<R, AxiosResponse<R>, T>({
        url,
        method,
        params,
        data: payload,
        timeout: ttl,
        headers: {
          ...this.inferHeaders(payload),
          'x-correlation-id': correlationId,
          'date': createdAt.toISOString()
        },
        ...(!expectReply ? { responseType: 'stream' } : {})
      });
    } catch (e) {
      const httpError = new HttpCommandError(e);

      this.logger.debug(
        'Command (%s) has been failed:',
        correlationId,
        httpError
      );

      throw httpError;
    }
  }

  private createHttpClient(): RateLimitedAxiosInstance {
    const {
      baseUrl,
      token,
      timeout = 10000,
      rate = { limit: 10, window: 60 * 1000 }
    } = this.options;

    const options: AxiosRequestConfig = {
      timeout,
      baseURL: baseUrl,
      responseType: 'json',
      headers: {
        authorization: `api-key ${token}`
      },
      transitional: {
        clarifyTimeoutError: true
      }
    };

    return rateLimit(axios.create(options), {
      maxRequests: rate.limit,
      perMilliseconds: rate.window
    });
  }

  private inferHeaders<T>(data: T): Record<string, string | string[]> {
    let headers: Record<string, string | string[]> = {};

    if (data instanceof FormData) {
      headers = data.getHeaders();
    }

    return headers;
  }
}
