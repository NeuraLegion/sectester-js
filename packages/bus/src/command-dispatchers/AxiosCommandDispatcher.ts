import { HttpCommandDispatcher } from './HttpCommandDispatcher';
import { HttpCommandDispatcherConfig } from './HttpCommandDispatcherConfig';
import { HttpCommand } from './HttpCommand';
import { IllegalOperation } from '@secbox/core';
import { inject } from 'tsyringe';
import axios, { AxiosRequestHeaders, AxiosRequestConfig } from 'axios';
import { RateLimitedAxiosInstance } from 'axios-rate-limit';

export class AxiosCommandDispatcher implements HttpCommandDispatcher {
  private client?: RateLimitedAxiosInstance;
  constructor(
    @inject(HttpCommandDispatcherConfig)
    private readonly options: HttpCommandDispatcherConfig
  ) {}

  public async init(): Promise<void> {
    const axiosRateLimit = (await import('axios-rate-limit')).default;
    const { axiosLimitOptions } = this.options;
    const axiosOptions = this.getAxiosOptions(this.options);

    this.client = axiosRateLimit(
      axios.create(axiosOptions),
      axiosLimitOptions ?? {}
    );
  }

  public async execute<T, R>(
    command: HttpCommand<T, R>
  ): Promise<R | undefined> {
    if (!this.client) {
      throw new IllegalOperation(this);
    }

    const { url, method, ttl, payload, expectReply } = command;

    const response = this.client.request({
      url,
      method,
      data: payload,
      timeout: ttl
    });

    return expectReply ? (await response).data : undefined;
  }

  private getAxiosOptions(
    options: HttpCommandDispatcherConfig
  ): AxiosRequestConfig {
    const headers = this.getHeaders(options);

    return {
      baseURL: options.url,
      headers
    };
  }

  private getHeaders(
    options: HttpCommandDispatcherConfig
  ): AxiosRequestHeaders {
    let headers: AxiosRequestHeaders = {};
    if (options.credentials) {
      headers = {
        ...headers,
        authorization: `Basic ${this.getToken(
          options.credentials.username,
          options.credentials?.password
        )}`
      };
    }

    return headers;
  }

  private getToken(user: string, apiKey: string): string {
    return Buffer.from(`${user}:${apiKey}`).toString('base64');
  }
}
