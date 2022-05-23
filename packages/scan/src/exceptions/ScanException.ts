import { ScanExceptionCode } from './ScanExceptionCode';
import { SecTesterError } from '@sec-tester/core';

export abstract class ScanException extends SecTesterError {
  abstract get type(): ScanExceptionCode;

  protected constructor(message: string) {
    super(message);
  }
}
