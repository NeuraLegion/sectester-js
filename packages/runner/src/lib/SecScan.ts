import { SecTarget } from './SecTarget';
import { Severity } from '../models';

export interface SecScan {
  threshold(severity?: Severity): SecScan;
  run(target: SecTarget): Promise<void>;
}
