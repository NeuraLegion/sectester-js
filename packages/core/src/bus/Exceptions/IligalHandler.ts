export class NoSubscriptionsFound extends Error {
  constructor(handler: EventHandler<unknown, unknown>) {
    super(`No subscriptions found. Please use '@bind()' decorator to subscribe ${handler.constructor.name} to events.`);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
