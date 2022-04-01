import 'reflect-metadata';
import { Event, EventType } from '../Event';

export function bind<T>(event: EventType<T>): ClassDecorator {
  return target => {
    Reflect.defineMetadata(Event, event, target);
  };
}
