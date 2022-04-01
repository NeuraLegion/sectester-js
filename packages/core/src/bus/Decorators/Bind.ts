import 'reflect-metadata';
import { Event, EventType } from '../Event';

export const bind =
  (...events: typeof Event[]): ClassDecorator =>
  (target) => {
    Reflect.defineMetadata(Event, events, target);
  };

