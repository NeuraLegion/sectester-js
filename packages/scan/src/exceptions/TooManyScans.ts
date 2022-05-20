import { ScanException } from './ScanException';
import { ScanExceptionCode } from './ScanExceptionCode';

export class TooManyScans extends ScanException {
  get type() {
    return ScanExceptionCode.TOO_MANY;
  }

  constructor() {
    super(`The maximum amount of concurrent scans has been reached for the organization. 
        Please upgrade your subscription or contact your system administrator.`);
  }
}
