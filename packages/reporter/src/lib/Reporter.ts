import { Scan } from '@secbox/scan';

export interface Reporter {
  report(scan: Scan): Promise<void>;
}
