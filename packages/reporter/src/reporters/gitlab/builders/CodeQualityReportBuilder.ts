import type {
  CodeQualityReport,
  CodeQualityIssue,
  CodeQualitySeverity
} from '../types';
import { Issue, Severity } from '@sectester/scan';
import { createHash } from 'node:crypto';

export class CodeQualityReportBuilder {
  constructor(
    private readonly issues: Issue[],
    private readonly testFilePath: string
  ) {}

  public build(): CodeQualityReport {
    return this.issues.map(issue => this.convertIssueToCodeQualityIssue(issue));
  }

  private convertIssueToCodeQualityIssue(issue: Issue): CodeQualityIssue {
    const { originalRequest, name, severity } = issue;
    const description = `${name} vulnerability found at ${originalRequest.method.toUpperCase()} ${originalRequest.url}`;

    const fingerprint = this.createFingerprint(issue);

    const gitlabSeverity = this.mapSeverity(severity);

    return {
      description,
      fingerprint,
      check_name: name,
      severity: gitlabSeverity,
      raw_details: JSON.stringify(issue, null, 2),
      location: {
        path: this.testFilePath,
        lines: {
          begin: 1
        }
      }
    };
  }

  private createFingerprint(issue: Issue): string {
    const content = `${issue.name}-${issue.entryPointId}`;

    return createHash('md5').update(content).digest('hex');
  }

  private mapSeverity(severity: Severity): CodeQualitySeverity {
    switch (severity) {
      case Severity.LOW:
        return 'minor';
      case Severity.MEDIUM:
        return 'major';
      case Severity.HIGH:
        return 'critical';
      case Severity.CRITICAL:
        return 'blocker';
      default:
        return 'info';
    }
  }
}
