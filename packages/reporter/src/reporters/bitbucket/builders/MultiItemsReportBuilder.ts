import type { Report } from '../types';
import { BaseReportBuilder } from './BaseReportBuilder';
import { ReportBuildResult } from './ReportBuilder';
import type { Issue, Scan } from '@sectester/scan';
import { Severity } from '@sectester/scan';

export class MultiItemsReportBuilder extends BaseReportBuilder {
  constructor(
    private readonly scan: Scan,
    private readonly issues: Issue[],
    testFilePath: string
  ) {
    super(testFilePath);
  }

  public build(): ReportBuildResult {
    const report = this.buildReport();
    const annotations = this.issues.map(issue =>
      this.convertIssueToAnnotation(issue)
    );

    return { report, annotations };
  }

  private buildReport(): Report {
    const severityCounts = this.countSeverities();

    return {
      title: `SecTester (${this.issues.length} issues)`,
      details: this.buildDetails(),
      reporter: 'SecTester',
      link: this.scan.link,
      report_type: 'SECURITY',
      result: 'FAILED',
      data: [
        {
          title: 'Total Issues',
          type: 'NUMBER',
          value: this.issues.length
        },
        ...(severityCounts[Severity.CRITICAL] > 0
          ? [
              {
                title: 'Critical',
                type: 'NUMBER' as const,
                value: severityCounts[Severity.CRITICAL]
              }
            ]
          : []),
        ...(severityCounts[Severity.HIGH] > 0
          ? [
              {
                title: 'High',
                type: 'NUMBER' as const,
                value: severityCounts[Severity.HIGH]
              }
            ]
          : []),
        ...(severityCounts[Severity.MEDIUM] > 0
          ? [
              {
                title: 'Medium',
                type: 'NUMBER' as const,
                value: severityCounts[Severity.MEDIUM]
              }
            ]
          : []),
        ...(severityCounts[Severity.LOW] > 0
          ? [
              {
                title: 'Low',
                type: 'NUMBER' as const,
                value: severityCounts[Severity.LOW]
              }
            ]
          : [])
      ]
    };
  }

  private countSeverities(): Record<Severity, number> {
    return this.issues.reduce<Record<Severity, number>>(
      (counts, issue) => {
        counts[issue.severity] = counts[issue.severity] + 1;

        return counts;
      },
      {
        [Severity.CRITICAL]: 0,
        [Severity.HIGH]: 0,
        [Severity.MEDIUM]: 0,
        [Severity.LOW]: 0
      }
    );
  }

  private buildDetails(): string {
    return `SecTester found ${this.issues.length} issues`;
  }
}
