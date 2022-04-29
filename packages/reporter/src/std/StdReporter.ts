import { Reporter } from '../lib';
import { Issue, Scan, Severity } from '../models';
import { IssuesGrouper } from '../utils';
import table, { Header } from 'tty-table';
import chalk from 'chalk';

export class StdReporter implements Reporter {
  private readonly severityColorFn: Record<
    Severity,
    (...x: unknown[]) => string
  > = {
    [Severity.HIGH]: chalk.red,
    [Severity.MEDIUM]: chalk.yellow,
    [Severity.LOW]: chalk.blue
  };

  private readonly severityPrintFn: Record<
    Severity,
    (...x: unknown[]) => void
  > = {
    /* eslint-disable no-console */
    [Severity.HIGH]: console.error,
    [Severity.MEDIUM]: console.warn,
    [Severity.LOW]: console.log
    /* eslint-enable no-console */
  };

  public async report(scan: Scan): Promise<void> {
    const issues: Issue[] = await scan.issues();
    if (!issues.length) {
      return;
    }

    [Severity.HIGH, Severity.MEDIUM, Severity.LOW].forEach(
      (severity: Severity) => {
        const message = this.formatFindingsMessage(issues, severity);
        if (message) {
          this.print(message, severity);
        }
      }
    );

    // eslint-disable-next-line no-console
    console.log(this.renderDetailsTable(issues));
  }

  private formatFindingsMessage(
    issues: Issue[],
    severity: Severity
  ): string | undefined {
    const filtered = issues.filter(issue => issue.severity === severity);
    if (filtered.length) {
      return this.colorize(
        `Found ${filtered.length} ${severity} severity ${this.pluralize(
          'issue',
          filtered.length
        )}.`,
        severity
      );
    }
  }

  private renderDetailsTable(issues: Issue[]): string {
    const issueGroups = IssuesGrouper.group(issues);

    return table(
      [
        this.getHeaderConfig('severity', {
          formatter: x => this.colorize(x, x),
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

  private pluralize(word: string, quantity: number): string {
    return quantity > 1 ? `${word}s` : word;
  }

  private colorize(message: string, severity: Severity): string {
    return this.severityColorFn[severity](message);
  }

  private print(message: string, severity: Severity): void {
    return this.severityPrintFn[severity](message);
  }
}
