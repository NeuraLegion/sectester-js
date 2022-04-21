import { Scan } from '../models';

export interface Reporter {
  report(scan: Scan): Promise<void>;
}
