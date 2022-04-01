export class IntegrationEventHandlerNotFound extends Error {
  constructor(...eventNames: string[]) {
    super(
      `For events ${eventNames.join(', ')} was not registered any handlers.`
    );
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
