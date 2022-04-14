import { Protocol } from '../../request-executor';
import { Event } from '@secbox/core';

interface ExecuteRequestEventPayload {
  readonly protocol: Protocol;
  readonly url: string;
  readonly headers: Record<string, string | string[]>;
  readonly method?: string;
  readonly body?: string;
  readonly correlationIdRegex?: string;
}

export class ExecuteRequestEvent extends Event<ExecuteRequestEventPayload> {
  constructor(payload: ExecuteRequestEventPayload) {
    super(payload);
  }
}
