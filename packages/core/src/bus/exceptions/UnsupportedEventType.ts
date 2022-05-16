export class UnsupportedEventType extends Error {
  constructor(event: unknown) {
    super(`${typeof event} cannot be used with the @bind decorator.`);
    this.name = new.target.name;
  }
}
