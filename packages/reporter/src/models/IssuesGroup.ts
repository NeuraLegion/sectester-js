import { Issue } from './Issue';
import { Severity } from './Severity';

export interface IssuesGroup {
  severity: Severity;
  name: string;
  issues: Issue[];
}
