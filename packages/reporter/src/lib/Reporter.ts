import { Scan } from '@sec-tester/scan';

export interface Reporter {
  report(scan: Scan): Promise<void>;
}

export const Reporter: unique symbol = Symbol('Reporter');
