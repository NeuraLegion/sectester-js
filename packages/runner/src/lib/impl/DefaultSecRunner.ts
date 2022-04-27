import { SecRunner } from '../SecRunner';
import { ScanSettings, TargetOptions } from '../../models';
import { SecScan } from '../SecScan';
import { SecTarget } from '../SecTarget';
import { DefaultSecTarget } from './DefaultSecTarget';
import { DefaultSecScan } from './DefaultSecScan';
import { ConfigurationOptions } from '@secbox/core';

export class DefaultSecRunner implements SecRunner {
  constructor(_config: ConfigurationOptions) {
    /** noop **/
  }

  public init(_unnamedOptions: unknown): Promise<void> {
    return Promise.resolve();
  }

  public clear(): Promise<void> {
    return Promise.resolve(undefined);
  }

  public createScan(settings: ScanSettings): SecScan {
    return new DefaultSecScan(settings);
  }

  public createTarget(options: TargetOptions): SecTarget {
    return new DefaultSecTarget(options);
  }
}
