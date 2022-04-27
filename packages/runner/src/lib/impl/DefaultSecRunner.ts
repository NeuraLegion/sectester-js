import { SecRunner } from '../SecRunner';
import { ScanSettings, TargetOptions } from '../../models';
import { SecScan } from '../SecScan';
import { SecTarget } from '../SecTarget';
import { DefaultSecTarget } from './DefaultSecTarget';
import { DefaultSecScan } from './DefaultSecScan';
import { ConfigurationOptions } from '@secbox/core';
import { RequestRunnerOptions } from '@secbox/repeater';

export class DefaultSecRunner implements SecRunner {
  constructor(_config: ConfigurationOptions) {
    /** noop **/
  }

  public init(_options: Partial<RequestRunnerOptions>): Promise<void> {
    // TODO among others - create & start repeater
    return Promise.resolve();
  }

  public clear(): Promise<void> {
    // TODO among others - stop & delete repeater
    return Promise.resolve(undefined);
  }

  public createScan(settings: ScanSettings): SecScan {
    return new DefaultSecScan(settings);
  }

  public createTarget(options: TargetOptions): SecTarget {
    return new DefaultSecTarget(options);
  }
}
