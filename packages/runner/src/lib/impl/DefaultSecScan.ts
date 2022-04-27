import { SecScan } from '../SecScan';
import { SecTarget } from '../SecTarget';
import { ScanSettings, Severity } from '../../models';

export class DefaultSecScan implements SecScan {
  constructor(_settings: ScanSettings) {
    /* noop */
  }

  public run(_target: SecTarget): Promise<void> {
    return Promise.resolve();
  }

  public threshold(_severity?: Severity): SecScan {
    return this;
  }
}
