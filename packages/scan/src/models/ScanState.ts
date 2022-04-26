import { IssueGroup } from './IssueGroup';
import { ScanStatus } from './ScanStatus';

export interface ScanState {
  status: ScanStatus;
  issuesBySeverity?: IssueGroup[];
  entryPoints?: number;
  totalParams?: number;
  discovering?: boolean;
  requests?: number;
  elapsed?: number;
  startTime?: Date;
  endTime?: Date;
  createdAt?: Date;
}
