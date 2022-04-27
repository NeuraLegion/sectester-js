import { SecScan } from './SecScan';

export interface SecTarget {
  run(scan: SecScan): Promise<void>;
}
