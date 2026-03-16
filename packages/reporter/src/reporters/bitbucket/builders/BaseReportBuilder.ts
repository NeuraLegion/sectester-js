import { ReportBuilder, ReportBuildResult } from './ReportBuilder';
import type { ReportAnnotation, AnnotationSeverity } from '../types';
import type { Issue } from '@sectester/scan';
import { Severity } from '@sectester/scan';

export abstract class BaseReportBuilder implements ReportBuilder {
  protected readonly reportId: string;

  constructor(protected readonly testFilePath: string) {
    this.reportId = `sectester-${Date.now()}`;
  }

  public abstract build(): ReportBuildResult;

  public getReportId(): string {
    return this.reportId;
  }

  protected convertIssueToAnnotation(issue: Issue): ReportAnnotation {
    const { originalRequest, name, severity, link, details } = issue;

    return {
      details,
      link,
      title: name,
      external_id: issue.id,
      annotation_type: 'VULNERABILITY',
      summary: `${name} vulnerability found at ${originalRequest.method} ${originalRequest.url}`,
      result: 'FAILED',
      severity: this.mapSeverity(severity),
      path: this.testFilePath,
      line: 1
    };
  }

  protected mapSeverity(severity: Severity): AnnotationSeverity {
    switch (severity) {
      case Severity.CRITICAL:
        return 'CRITICAL';
      case Severity.HIGH:
        return 'HIGH';
      case Severity.MEDIUM:
        return 'MEDIUM';
      case Severity.LOW:
        return 'LOW';
    }
  }
}
