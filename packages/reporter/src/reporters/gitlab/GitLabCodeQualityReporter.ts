import { Reporter } from '../../lib';
import { GITLAB_REPORT_SENDER } from './api';
import type { GitLabReportSender } from './api';
import { CodeQualityReportBuilder } from './builders';
import { TestFilePathResolver } from '../../utils';
import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';

/**
 * GitLab Code Quality reporter that writes security scan results to files.
 * Converts SecTester scan issues into GitLab Code Quality format and writes them
 * to files that GitLab CI can pick up for display in merge requests and pipelines.
 */
@injectable()
export class GitLabCodeQualityReporter implements Reporter {
  constructor(
    @inject(GITLAB_REPORT_SENDER)
    private readonly gitlabReportSender: GitLabReportSender
  ) {}

  /**
   * Reports scan results by writing a Code Quality report to file.
   * Only generates and writes a report if security issues are found.
   *
   * @param scan - The scan containing security issues to report
   */
  public async report(scan: Scan): Promise<void> {
    const issues = await scan.issues();

    if (issues.length > 0) {
      await this.generateCodeQualityReport(issues);
    }
  }

  /**
   * Generates and writes a Code Quality report to file.
   *
   * @param issues - The security issues to include in the report
   */
  private async generateCodeQualityReport(issues: Issue[]): Promise<void> {
    const testFilePath = TestFilePathResolver.getTestFilePath();
    const codeQualityReport = this.createCodeQualityReportBuilder(
      issues,
      testFilePath
    ).build();
    await this.gitlabReportSender.sendCodeQualityReport(codeQualityReport);
  }

  /**
   * Creates a Code Quality report builder for the given issues.
   *
   * @param issues - The security issues to include in the report
   * @param testFilePath - The path to the test file where issues were found
   * @returns A configured Code Quality report builder
   */
  private createCodeQualityReportBuilder(
    issues: Issue[],
    testFilePath: string
  ): CodeQualityReportBuilder {
    return new CodeQualityReportBuilder(issues, testFilePath);
  }
}
