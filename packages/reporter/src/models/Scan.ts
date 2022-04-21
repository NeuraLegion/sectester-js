import { Issue } from './Issue';

export interface Scan {
  issues(): Promise<Issue[]>;
}
