import { Issue } from './Issue';

// TODO utilize models from @secbox/scan
export interface Scan {
  issues(): Promise<Issue[]>;
}
