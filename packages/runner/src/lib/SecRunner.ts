import { ScanSettings, TargetOptions } from '../models';
import { SecTarget } from './SecTarget';
import { SecScan } from './SecScan';
import { RequestRunnerOptions } from '@secbox/repeater';

export interface SecRunner {
  // ctor (config: ConfigurationOptions): SecRunner;

  init(options: Partial<RequestRunnerOptions>): Promise<void>;
  clear(): Promise<void>;

  createTarget(options: TargetOptions): SecTarget;
  createScan(settings: Omit<ScanSettings, 'name'> & { name?: string }): SecScan;
}
