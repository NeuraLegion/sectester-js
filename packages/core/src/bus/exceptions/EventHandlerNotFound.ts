export class EventHandlerNotFound extends Error {
  constructor(...eventNames: string[]) {
    super(
      `Event handler not found. Please register a handler for the following events: ${eventNames.join(
        ', '
      )}`
    );
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
