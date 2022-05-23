import { ScanException } from './ScanException';
import { ScanExceptionCode } from './ScanExceptionCode';
import { ScanStatus } from '../models';

export class ScanAborted extends ScanException {
  get type() {
    return ScanExceptionCode.ABORTED;
  }

  constructor(status: ScanStatus) {
    super(`Scan ${status}.`);
  }
}
