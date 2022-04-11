import { Command } from '@secbox/core';
import { Method } from 'axios';

export abstract class HttpCommand<T, R> extends Command<T, R> {
  public readonly method: Method;
  public readonly url: string;

  protected constructor(
    payload: T,
    url: string,
    method: Method,
    expectReply?: boolean,
    ttl?: number,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, expectReply, ttl, type, correlationId, createdAt);

    if (typeof url !== 'string') {
      throw new Error();
    }

    if (!method) {
      throw new Error();
    }

    this.url = url;
    this.method = method;
  }
}
