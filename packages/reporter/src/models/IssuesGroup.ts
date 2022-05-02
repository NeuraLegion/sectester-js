import { Issue, Severity } from '@secbox/scan';

export interface IssuesGroup {
  severity: Severity;
  name: string;
  issues: Issue[];
}
