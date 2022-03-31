import 'reflect-metadata';
import { Event, EventType } from '../Event';

export const bind =
  (...events: EventType[]): ClassDecorator =>
  (target) => {
    Reflect.defineMetadata(Event, events, target);
  };

