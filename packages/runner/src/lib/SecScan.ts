import { SecTarget } from './SecTarget';

export interface SecScan {
  threshold(severity?: 'high' | 'medium' | 'low'): SecScan;
  run(target: SecTarget): Promise<void>;
}
