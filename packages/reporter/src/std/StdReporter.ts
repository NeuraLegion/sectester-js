import { Reporter } from '../lib';
import { Issue, Scan, Severity } from '../models';
import { IssuesGrouper } from '../utils';
import Table, { Header } from 'tty-table';
import chalk from 'chalk';

/* eslint-disable no-console */

export class StdReporter implements Reporter {
  public async report(scan: Scan): Promise<void> {
    const issues: Issue[] = await scan.issues();
    if (!issues.length) {
      return;
    }

    [Severity.HIGH, Severity.MEDIUM, Severity.LOW].forEach(
      (severity: Severity) => {
        const message = this.formatMessage(issues, severity);
        if (message) {
          this.getStdoutFn(severity)(message);
        }
      }
    );

    console.log(this.renderDetailsTable(issues));
  }

  private formatMessage(
    issues: Issue[],
    severity: Severity
  ): string | undefined {
    const filtered = issues.filter(issue => issue.severity === severity);
    if (!filtered.length) {
      return undefined;
    }

    const pluralize = (x: any[]) => (x.length > 1 ? 's' : '');

    return this.getColorFn(severity)(
      `Found ${filtered.length} ${severity} severity issue${pluralize(
        filtered
      )}.`
    );
  }

  private renderDetailsTable(issues: Issue[]): string {
    const issueGroups = IssuesGrouper.group(issues);

    return Table(
      [
        this.getHeaderConfig('severity', {
          formatter: x => this.getColorFn(x)(x),
          width: 10
        }),
        this.getHeaderConfig('name'),
        this.getHeaderConfig('issues', {
          alias: 'Quantity',
          formatter: items => items.length,
          align: 'center',
          width: 10
        }),
        this.getHeaderConfig('issues', {
          alias: 'Targets',
          formatter: (items: Issue[]) =>
            items
              .map((item, idx) => `${idx + 1}.\u00A0${item.request.url}`)
              .join('\n')
        })
      ] as Header[],
      issueGroups
    ).render();
  }

  private getHeaderConfig(
    fieldName: string,
    options: Partial<Header> = {}
  ): Header {
    const defaultHeaderConfig: Partial<Header> = {
      width: '',
      headerColor: '',
      align: 'left',
      headerAlign: 'left',
      value: fieldName,
      alias: `${fieldName.charAt(0).toUpperCase()}${fieldName.substring(1)}`
    };

    return {
      ...defaultHeaderConfig,
      ...options
    } as Header;
  }

  private getColorFn(severity: Severity): (...x: unknown[]) => string {
    switch (severity) {
      case Severity.HIGH:
        return chalk.red;
      case Severity.MEDIUM:
        return chalk.yellow;
      case Severity.LOW:
        return chalk.blue;
    }
  }

  private getStdoutFn(severity: Severity): (...x: unknown[]) => void {
    switch (severity) {
      case Severity.HIGH:
        return console.error;
      case Severity.MEDIUM:
        return console.warn;
      case Severity.LOW:
        return console.log;
    }
  }
}
