import { Command } from './Command';

export interface CommandDispatcher {
  execute<T, R>(command: Command<T, R>): Promise<R | undefined>;
}

export const CommandDispatcher: unique symbol = Symbol('CommandDispatcher');
