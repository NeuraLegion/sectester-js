import type { CheckRunPayload } from '../types';
import { BasePayloadBuilder } from './BasePayloadBuilder';
import type { Issue } from '@sectester/scan';
import { Severity } from '@sectester/scan';

export class MultiItemsPayloadBuilder extends BasePayloadBuilder {
  constructor(
    private readonly issues: Issue[],
    commitSha: string | undefined,
    testFilePath: string
  ) {
    super(commitSha, testFilePath);
  }

  public build(): CheckRunPayload {
    return {
      name: `SecTester (${this.issues.length} issues)`,
      head_sha: this.commitSha,
      conclusion: 'failure',
      output: {
        title: `${this.issues.length} vulnerabilities detected in application endpoints`,
        summary: this.buildSummary(),
        text: this.buildDetails(),
        annotations: this.issues.map(issue =>
          this.convertIssueToAnnotation(issue)
        )
      }
    };
  }

  private buildSummary(): string {
    const severityCounts = this.issues.reduce(
      (counts, issue) => {
        counts[issue.severity] = (counts[issue.severity] || 0) + 1;

        return counts;
      },
      {} as Record<Severity, number>
    );

    const parts = [];
    if (severityCounts[Severity.CRITICAL]) {
      parts.push(`${severityCounts[Severity.CRITICAL]} Critical`);
    }
    if (severityCounts[Severity.HIGH]) {
      parts.push(`${severityCounts[Severity.HIGH]} High`);
    }
    if (severityCounts[Severity.MEDIUM]) {
      parts.push(`${severityCounts[Severity.MEDIUM]} Medium`);
    }
    if (severityCounts[Severity.LOW]) {
      parts.push(`${severityCounts[Severity.LOW]} Low`);
    }

    return parts.length > 0
      ? `${parts.join(', ')} severity issues found`
      : 'No issues found';
  }

  private buildDetails(): string {
    return this.issues
      .map(issue => {
        const method = issue.originalRequest.method?.toUpperCase() ?? 'GET';
        const pathname = new URL(issue.originalRequest.url).pathname;

        return `- ${method} ${pathname}: ${issue.name}`;
      })
      .join('\n');
  }
}
