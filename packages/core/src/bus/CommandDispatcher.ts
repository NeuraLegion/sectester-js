import { Command } from './Command';

export interface CommandDispatcher {
  execute<T, R>(command: Command<T, R>): Promise<R>;
}
