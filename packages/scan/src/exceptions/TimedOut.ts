import { ScanException } from './ScanException';
import { ScanExceptionCode } from './ScanExceptionCode';

export class TimedOut extends ScanException {
  get type() {
    return ScanExceptionCode.TIMED_OUT;
  }

  constructor(timeout: number) {
    super(
      `The expectation was not satisfied within the ${timeout} ms timeout specified.`
    );
  }
}
