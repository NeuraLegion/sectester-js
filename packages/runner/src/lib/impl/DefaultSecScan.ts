import { SecScan } from '../SecScan';
import { SecTarget } from '../SecTarget';
import { ScanSettings } from '../../models';

export class DefaultSecScan implements SecScan {
  constructor(_settings: ScanSettings) {
    /* noop */
  }

  public run(_target: SecTarget): Promise<void> {
    return Promise.resolve();
  }

  public threshold(_severity?: 'high' | 'medium' | 'low'): SecScan {
    return this;
  }
}
