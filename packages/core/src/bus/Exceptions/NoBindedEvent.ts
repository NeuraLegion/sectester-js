export class NoBindedEvent extends Error {
  constructor() {
    super(`For handler nan't find any binded event`);
  }
}
