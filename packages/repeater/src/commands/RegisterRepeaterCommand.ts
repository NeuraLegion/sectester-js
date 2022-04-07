import { Command } from '@secbox/core';

export interface RegisterRepeaterCommandPayload {
  version: string;
  repeaterId: string;
}

export interface RegisterRepeaterResult {
  version: string;
  script: string | Record<string, string>;
}

export class RegisterRepeaterCommand extends Command<
  RegisterRepeaterCommandPayload,
  RegisterRepeaterResult
> {
  constructor(payload: RegisterRepeaterCommandPayload) {
    // TODO rework Command ctor
    super(payload, true, 10000, 'RepeaterRegistering');
  }
}
