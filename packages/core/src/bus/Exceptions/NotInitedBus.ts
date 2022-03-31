export class IllegalOperation extends Error {
  constructor(instance: EventDispatcher | CommandDispatcher) {
    super(`Please make sure that `${instance.constructor.name}` established a connection with host..');
  }
}
