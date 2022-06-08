import { Issue, Severity } from '@sectester/scan';

export interface IssuesGroup {
  severity: Severity;
  name: string;
  issues: Issue[];
}
