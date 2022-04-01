export class NoResponse extends Error {
  constructor(duration: number) {
    super(`No response for ${duration} seconds.`);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
