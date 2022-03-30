export class NotInitedBus extends Error {
  constructor() {
    super('You should call `init()` to proceed working with distpacher.');
  }
}
