import 'reflect-metadata';
import { Event } from '../Event';

export const bind =
  (...events: typeof Event[]): ClassDecorator =>
  target => {
    Reflect.defineMetadata(Event, events, target);
  };
