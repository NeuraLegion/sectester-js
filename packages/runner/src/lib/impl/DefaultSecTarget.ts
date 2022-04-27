import { SecTarget } from '../SecTarget';
import { SecScan } from '../SecScan';
import { TargetOptions } from '../../models';

export class DefaultSecTarget implements SecTarget {
  constructor(_options: TargetOptions) {
    /* noop */
  }

  public run(scan: SecScan): Promise<void> {
    return scan.run(this);
  }
}
