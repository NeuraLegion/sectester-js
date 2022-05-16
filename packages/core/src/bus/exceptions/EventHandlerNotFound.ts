import { SecTesterError } from '../../exceptions';

export class EventHandlerNotFound extends SecTesterError {
  constructor(...eventNames: string[]) {
    super(
      `Event handler not found. Please register a handler for the following events: ${eventNames.join(
        ', '
      )}`
    );
  }
}
