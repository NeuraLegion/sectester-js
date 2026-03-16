import type { Report } from '../types';
import { BaseReportBuilder } from './BaseReportBuilder';
import { ReportBuildResult } from './ReportBuilder';
import type { Issue } from '@sectester/scan';

export class SingleItemReportBuilder extends BaseReportBuilder {
  constructor(
    private readonly issue: Issue,
    testFilePath: string
  ) {
    super(testFilePath);
  }

  public build(): ReportBuildResult {
    const report = this.buildReport();
    const annotations = [this.convertIssueToAnnotation(this.issue)];

    return { report, annotations };
  }

  private buildReport(): Report {
    return {
      title: `SecTester - ${this.buildEndpoint()}`,
      details: this.issue.details,
      reporter: 'SecTester',
      report_type: 'SECURITY',
      result: 'FAILED',
      link: this.issue.link,
      data: [
        {
          title: 'Vulnerability',
          type: 'TEXT',
          value: this.issue.name
        },
        {
          title: 'Severity',
          type: 'TEXT',
          value: this.issue.severity
        }
      ]
    };
  }

  private buildEndpoint(): string {
    const method = this.issue.originalRequest.method.toUpperCase();
    const pathname = new URL(this.issue.originalRequest.url).pathname;

    return `${method} ${pathname}`;
  }
}
