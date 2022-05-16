import { CommandDispatcher } from '../CommandDispatcher';
import { EventDispatcher } from '../EventDispatcher';
import { SecTesterError } from '../../exceptions';
import { getTypeName } from '../../utils';

export class IllegalOperation extends SecTesterError {
  constructor(instance: EventDispatcher | CommandDispatcher) {
    super(
      `Please make sure that ${getTypeName(
        instance
      )} established a connection with host.`
    );
  }
}
