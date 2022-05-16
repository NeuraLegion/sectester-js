import { SecTesterError } from '../../exceptions';
import { getTypeName } from '../../utils';

export class UnsupportedEventType extends SecTesterError {
  constructor(event: unknown) {
    super(`${getTypeName(event)} cannot be used with the @bind decorator.`);
    this.name = new.target.name;
  }
}
