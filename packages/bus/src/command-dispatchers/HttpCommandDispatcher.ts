import { CommandDispatcher } from '@secbox/core';

export interface HttpCommandDispatcher extends CommandDispatcher {
  init?(): Promise<void>;
}
