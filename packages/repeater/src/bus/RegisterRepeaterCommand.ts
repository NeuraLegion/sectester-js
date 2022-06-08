import { Command } from '@sectester/core';

export interface RegisterRepeaterCommandPayload {
  version: string;
  repeaterId: string;
}

export type RegisterRepeaterResult =
  | {
      version: string;
      script: string | Record<string, string>;
    }
  | { error: RepeaterRegisteringError };

export enum RepeaterRegisteringError {
  NOT_ACTIVE = 'not_active',
  BUSY = 'busy',
  REQUIRES_TO_BE_UPDATED = 'requires_to_be_updated',
  NOT_FOUND = 'not_found'
}

export class RegisterRepeaterCommand extends Command<
  RegisterRepeaterCommandPayload,
  { payload: RegisterRepeaterResult }
> {
  constructor(payload: RegisterRepeaterCommandPayload) {
    super(payload, { type: 'RepeaterRegistering' });
  }
}
