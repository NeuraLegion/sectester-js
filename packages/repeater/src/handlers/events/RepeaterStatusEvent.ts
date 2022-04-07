import { RepeaterStatus } from '../../lib';
import { Event } from '@secbox/core';

export interface RepeaterStatusEventPayload {
  repeaterId: string;
  status: RepeaterStatus;
}

export class RepeaterStatusEvent extends Event<RepeaterStatusEventPayload> {
  constructor(payload: RepeaterStatusEventPayload) {
    super(payload, 'RepeaterStatusUpdated');
  }
}
