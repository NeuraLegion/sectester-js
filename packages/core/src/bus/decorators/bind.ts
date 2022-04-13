import { Event, EventConstructor } from '../Event';
import { UnsupportedEventType } from '../exceptions';

export type EventName = EventConstructor | string | symbol;

export const bind =
  (...events: EventName[]): ClassDecorator =>
  target => {
    const eventNames = events.map(event => {
      switch (typeof event) {
        case 'string':
          return event;
        case 'function':
          return event.name;
        case 'symbol':
          return event.description;
        default:
          throw new UnsupportedEventType(event);
      }
    });

    Reflect.defineMetadata(Event, eventNames, target);
  };
