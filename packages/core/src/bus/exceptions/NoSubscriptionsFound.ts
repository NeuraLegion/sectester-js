import { EventHandler } from '../EventHandler';
import { SecTesterError } from '../../exceptions';
import { getTypeName } from '../../utils';

export class NoSubscriptionsFound extends SecTesterError {
  constructor(handler: EventHandler<unknown, unknown>) {
    super(
      `No subscriptions found. Please use '@bind()' decorator to subscribe ${getTypeName(
        handler
      )} to events.`
    );
  }
}
