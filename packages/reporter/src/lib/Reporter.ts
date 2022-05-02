import { Scan } from '@secbox/scan';

export interface Reporter {
  report(scan: Scan): Promise<void>;
}

export const Reporter: unique symbol = Symbol('Reporter');
