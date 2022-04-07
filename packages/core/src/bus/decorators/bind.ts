import { Event, EventConstructor } from '../Event';

export const bind =
  (...events: EventConstructor[]): ClassDecorator =>
  target => {
    Reflect.defineMetadata(Event, events, target);
  };
