import { ScanSettings, TargetOptions } from '../models';
import { SecTarget } from './SecTarget';
import { SecScan } from './SecScan';

export interface SecRunner {
  // ctor (config: ConfigurationOptions): SecRunner;

  init(unnamedOptions: unknown): Promise<void>;
  clear(): Promise<void>;

  createTarget(options: TargetOptions): SecTarget;
  createScan(settings: ScanSettings): SecScan;
}
