import { Event } from './Event';
import { Handler } from './Handler';

export type EventHandler<T> = Handler<T, any>;

export declare type ExecutionResult<T> = Event<T> | unknown;
