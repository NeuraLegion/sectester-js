export class IligalHandler extends Error {
  constructor() {
    super(`Can't find event bound to handler. Please use 'bind' decorator`);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
