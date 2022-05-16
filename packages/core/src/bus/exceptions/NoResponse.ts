import { SecTesterError } from '../../exceptions';

export class NoResponse extends SecTesterError {
  constructor(duration: number) {
    super(`No response for ${duration} seconds.`);
  }
}
