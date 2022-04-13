import { HttpCommandDispatcherConfig } from './HttpCommandDispatcherConfig';
import { HttpRequest } from '../commands';
import { CommandDispatcher } from '@secbox/core';
import { inject, injectable } from 'tsyringe';
import axios, { AxiosRequestConfig } from 'axios';
import rateLimit, { RateLimitedAxiosInstance } from 'axios-rate-limit';
import { finished, Readable } from 'stream';
import { promisify } from 'util';

@injectable()
export class HttpCommandDispatcher implements CommandDispatcher {
  private readonly client: RateLimitedAxiosInstance;

  constructor(
    @inject(HttpCommandDispatcherConfig)
    private readonly options: HttpCommandDispatcherConfig
  ) {
    this.client = this.createHttpClient();
  }

  public async execute<T, R>(
    command: HttpRequest<T, R>
  ): Promise<R | undefined> {
    const response = await this.client.request(
      this.convertToHttpOptions(command)
    );

    if (!command.expectReply && response.data instanceof Readable) {
      // drain readable stream to avoid memory leaks
      response.data.on('readable', response.data.read.bind(response.data));
      await promisify(finished)(response.data);
    } else {
      return response.data;
    }
  }

  private convertToHttpOptions<T, R>(
    command: HttpRequest<T, R>
  ): AxiosRequestConfig<T> {
    const {
      url,
      params,
      method,
      expectReply,
      correlationId,
      createdAt,
      payload: data,
      ttl: timeout
    } = command;

    return {
      url,
      method,
      data,
      timeout,
      params,
      headers: {
        'x-correlation-id': correlationId,
        'date': createdAt.toISOString()
      },
      ...(!expectReply ? { responseType: 'stream' } : {})
    };
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
        forcedJSONParsing: false,
        silentJSONParsing: false,
        clarifyTimeoutError: true
      }
    };

    return rateLimit(axios.create(options), {
      maxRequests: rate.limit,
      perMilliseconds: rate.window
    });
  }
}
