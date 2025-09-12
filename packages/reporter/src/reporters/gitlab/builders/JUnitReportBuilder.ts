import type { TestReport, JUnitTestSuite, JUnitTestCase } from '../types';
import { type Issue } from '@sectester/scan';

export class JUnitReportBuilder {
  constructor(
    private readonly issues: Issue[],
    private readonly testFilePath: string
  ) {}

  public build(): TestReport {
    const testSuite = this.createTestSuite();

    return {
      testSuites: [testSuite]
    };
  }

  private createTestSuite(): JUnitTestSuite {
    const testCases = this.issues.map(issue =>
      this.convertIssueToTestCase(issue)
    );
    const failures = testCases.filter(tc => tc.failure).length;

    return {
      testCases,
      name: 'Security Tests',
      tests: testCases.length,
      failures,
      time: 0 // We don't have execution time
    };
  }

  private convertIssueToTestCase(issue: Issue): JUnitTestCase {
    const { originalRequest, name, severity } = issue;
    const testName = `${name} vulnerability found at ${originalRequest.method.toUpperCase()} ${originalRequest.url}`;

    const failureMessage = `${name} vulnerability found at ${originalRequest.method.toUpperCase()} ${originalRequest.url}`;
    const failureDetails = this.formatFailureDetails(issue);

    return {
      classname: severity,
      name: testName,
      file: this.testFilePath,
      time: 0,
      failure: {
        message: failureMessage,
        content: failureDetails
      },
      systemOut: this.formatSystemOutput(issue),
      systemErr: JSON.stringify(issue, null, 2)
    };
  }

  private formatFailureDetails(issue: Issue): string {
    const summaryLines = [
      `Name: ${issue.name}`,
      `Severity: ${issue.severity}`,
      `URL: ${issue.originalRequest.method.toUpperCase()} ${issue.originalRequest.url}`
    ];

    if (issue.link) {
      summaryLines.push(`Bright UI link: ${issue.link}`);
    }

    if (issue.remedy) {
      summaryLines.push(`\nRemediation:\n${issue.remedy}`);
    }

    const detailsParts = [`${issue.details}`];

    if (issue.comments?.length) {
      const extraDetails = issue.comments
        .map(comment => this.formatIssueComment(comment))
        .map(x => `- ${x}`)
        .join('\n');
      detailsParts.push(`\nExtra Details:\n${extraDetails}`);
    }

    if (issue.resources?.length) {
      const references = issue.resources.map(x => `- ${x}`).join('\n');
      detailsParts.push(`\nReferences:\n${references}`);
    }

    if (issue.cvss) {
      detailsParts.push(`\nCVSS: ${issue.cvss}`);
    }

    return [summaryLines.join('\n'), '', detailsParts.join('\n')].join('\n');
  }

  private formatIssueComment(comment: any): string {
    if (typeof comment === 'string') {
      return comment;
    }

    const { headline, text = '', links = [] } = comment;
    const body = [
      text,
      ...(links.length
        ? [`Links:\n${links.map((x: string) => `- ${x}`).join('\n')}`]
        : [])
    ].join('\n');

    return `${headline}${body ? `\n${body}` : ''}`;
  }

  private formatSystemOutput(issue: Issue): string {
    const { originalRequest } = issue;

    const outputLines = [
      `Request Method: ${originalRequest.method.toUpperCase()}`,
      `Request URL: ${originalRequest.url}`,
      `Entry Point ID: ${issue.entryPointId}`,
      `Issue ID: ${issue.id}`
    ];

    if (issue.screenshots?.length) {
      const attachments = issue.screenshots
        .map(screenshot => `[[ATTACHMENT|${screenshot.url}]]`)
        .join('\n');
      outputLines.push('', 'Screenshots:', attachments);
    }

    return outputLines.join('\n');
  }
}
