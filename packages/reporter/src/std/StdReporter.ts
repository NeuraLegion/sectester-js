import { Reporter } from '../lib';
import { Issue, Scan, Severity } from '../models';

/* eslint-disable no-console */

export class StdReporter implements Reporter {
  public async report(scan: Scan): Promise<void> {
    const issues: Issue[] = await scan.issues();

    if (issues.some(issue => issue.severity === Severity.HIGH)) {
      console.error('Found HIGH severity issue(s).');
    } else if (issues.some(issue => issue.severity === Severity.MEDIUM)) {
      console.warn('Found MEDIUM severity issue(s).');
    } else if (issues.some(issue => issue.severity === Severity.LOW)) {
      console.log('Found LOW severity issue(s).');
    }

    return Promise.resolve();
  }
}
