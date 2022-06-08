import { Command } from '@sectester/core';
import { Method } from 'axios';

export interface HttpOptions<T> {
  url: string;
  payload: T;
  method?: Method;
  expectReply?: boolean;
  ttl?: number;
  type?: string;
  correlationId?: string;
  params?: Record<string, unknown>;
  createdAt?: Date;
}

export class HttpRequest<T = undefined, R = void> extends Command<T, R> {
  public readonly method: Method;
  public readonly url: string;
  public readonly params?: Record<string, unknown>;

  constructor({
    payload,
    expectReply,
    ttl,
    type,
    params,
    correlationId,
    createdAt,
    url = '/',
    method = 'GET'
  }: HttpOptions<T>) {
    super(payload, { expectReply, ttl, type, correlationId, createdAt });

    if (typeof url !== 'string') {
      throw new TypeError(
        '`url` must be string. Please provide a valid URL or path that will be used for the command.'
      );
    }

    this.url = url;

    if (typeof method !== 'string') {
      throw new TypeError(
        '`method` must be string. Please provide a valid HTTP method that will be used for the command.'
      );
    }

    this.method = method;
    this.params = params;
  }
}
