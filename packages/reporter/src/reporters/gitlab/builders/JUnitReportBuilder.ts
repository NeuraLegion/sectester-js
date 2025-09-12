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
      failures,
      name: 'Bright Tests',
      tests: testCases.length,
      time: 0 // We don't have execution time
    };
  }

  private convertIssueToTestCase(issue: Issue): JUnitTestCase {
    const { originalRequest, name } = issue;
    const failure = `${name} vulnerability found at ${originalRequest.method.toUpperCase()} ${originalRequest.url}`;

    const baseUrl = new URL(originalRequest.url);
    baseUrl.hash = '';
    baseUrl.search = '';

    return {
      failure,
      name,
      classname: `${originalRequest.method.toUpperCase()} ${baseUrl.toString()}`,
      file: this.testFilePath,
      time: 0,
      systemOut: JSON.stringify(issue)
    };
  }
}
