import { CommandDispatcher } from '../CommandDispatcher';
import { EventDispatcher } from '../EventDispatcher';

export class IllegalOperation extends Error {
  constructor(instance: EventDispatcher | CommandDispatcher) {
    super(
      `Please make sure that ${instance.constructor.name} established a connection with host..`
    );
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
