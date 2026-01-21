import { Formatter } from '@sectester/reporter';
import { SecTesterError } from '@sectester/core';
import { Issue } from '@sectester/scan';

export class IssueFound extends SecTesterError {
  constructor(
    public readonly issue: Issue,
    formatter: Formatter
  ) {
    super(`Target is vulnerable\n\n${formatter.format(issue)}`);
  }
}
