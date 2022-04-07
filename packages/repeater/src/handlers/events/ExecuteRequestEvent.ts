import { Protocol } from '../../request-executor';
import { Event } from '@secbox/core';

export interface ExecuteRequestEventPayload {
  protocol: Protocol;
  url: string;
  headers: Record<string, string | string[]>;
  method?: string;
  body?: string;
  correlationIdRegex?: string;
}

export class ExecuteRequestEvent extends Event<ExecuteRequestEventPayload> {
  constructor(payload: ExecuteRequestEventPayload) {
    super(payload);
  }
}
