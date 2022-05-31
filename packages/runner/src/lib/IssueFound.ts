import { Formatter } from '@sec-tester/reporter';
import { SecTesterError } from '@sec-tester/core';
import { Issue } from '@sec-tester/scan';

export class IssueFound extends SecTesterError {
  constructor(public readonly issue: Issue, formatter: Formatter) {
    super(`Target is vulnerable\n\n${formatter.format(issue)}`);
  }
}
