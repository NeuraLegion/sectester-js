import type {
  CodeQualityReport,
  CodeQualityIssue,
  CodeQualitySeverity
} from '../types';
import type { Issue } from '@sectester/scan';
import crypto from 'node:crypto';

/**
 * Builder for creating GitLab Code Quality reports from SecTester scan issues.
 * Converts multiple issues into the GitLab Code Quality format.
 */
export class CodeQualityReportBuilder {
  constructor(
    private readonly issues: Issue[],
    private readonly testFilePath: string
  ) {}

  /**
   * Builds a GitLab Code Quality report from the provided issues.
   *
   * @returns An array of Code Quality issues in GitLab format
   */
  public build(): CodeQualityReport {
    return this.issues.map(issue => this.convertIssueToCodeQualityIssue(issue));
  }

  /**
   * Converts a SecTester issue to GitLab Code Quality issue format.
   *
   * @param issue - The SecTester issue to convert
   * @returns The corresponding GitLab Code Quality issue
   */
  private convertIssueToCodeQualityIssue(issue: Issue): CodeQualityIssue {
    const { originalRequest, name, severity } = issue;
    const description = `${name} vulnerability found at ${originalRequest.method.toUpperCase()} ${originalRequest.url}`;

    const fingerprint = this.createFingerprint(issue);

    // Map sectester severity to GitLab severity
    const gitlabSeverity = this.mapSeverity(severity);

    return {
      description,
      check_name: name,
      fingerprint,
      severity: gitlabSeverity,
      raw_details: JSON.stringify(issue, null, 2),
      location: {
        path: this.testFilePath,
        lines: {
          begin: 1,
          end: 1
        }
      }
    };
  }

  /**
   * Creates a unique fingerprint for an issue based on its characteristics.
   *
   * @param issue - The issue to create a fingerprint for
   * @returns A unique MD5 hash string
   */
  private createFingerprint(issue: Issue): string {
    const content = `${issue.name}-${issue.originalRequest.method}-${issue.originalRequest.url}`;

    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Maps SecTester vulnerability severity levels to GitLab Code Quality severity levels.
   *
   * @param severity - The SecTester severity level (low, medium, high, critical)
   * @returns The corresponding GitLab Code Quality severity level
   */
  private mapSeverity(severity: string): CodeQualitySeverity {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'minor';
      case 'medium':
        return 'major';
      case 'high':
        return 'critical';
      case 'critical':
        return 'blocker';
      default:
        return 'info';
    }
  }
}
