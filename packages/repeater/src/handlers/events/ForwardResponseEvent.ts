import { Protocol } from '../../request-executor';
import { Event } from '@secbox/core';

export interface ForwardResponseEventPayload {
  protocol: Protocol;
  body?: string;
  headers?: Record<string, string | string[] | undefined>;
  statusCode?: number;
  errorCode?: string;
  message?: string;
}

export class ForwardResponseEvent extends Event<ForwardResponseEventPayload> {
  constructor(payload: ForwardResponseEventPayload) {
    super(payload);
  }
}
