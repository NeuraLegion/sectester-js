import { Protocol } from '../../request-executor';
import { Event } from '@secbox/core';

interface ForwardResponseEventPayload {
  readonly protocol: Protocol;
  readonly body?: string;
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly statusCode?: number;
  readonly errorCode?: string;
  readonly message?: string;
}

export class ForwardResponseEvent extends Event<ForwardResponseEventPayload> {
  constructor(payload: ForwardResponseEventPayload) {
    super(payload);
  }
}
