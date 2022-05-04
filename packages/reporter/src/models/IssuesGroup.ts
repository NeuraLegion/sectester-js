import { Issue, Severity } from '@sec-tester/scan';

export interface IssuesGroup {
  severity: Severity;
  name: string;
  issues: Issue[];
}
