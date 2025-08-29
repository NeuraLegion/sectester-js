import { Reporter } from '../../lib';
import { GITLAB_REPORT_SENDER } from './api';
import type { GitLabReportSender } from './api';
import { CodeQualityReportBuilder } from './builders';

import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';
import path from 'node:path';

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
    const testFilePath = this.getTestFilePath();
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

  /**
   * Determines the test file path where the scan was executed.
   * Attempts to detect the test file from Jest or Node.js test runner context.
   *
   * @returns The relative path to the test file, or 'unknown' if not detectable
   */
  // TODO subject to improvement
  private getTestFilePath(): string {
    // Check if running in Jest environment
    const jestState = (global as any).expect?.getState();
    if (jestState) {
      const testPath = jestState.testPath;
      const rootDir = jestState.snapshotState._rootDir;

      return path.join(
        path.basename(rootDir),
        path.relative(rootDir, testPath)
      );
    }

    // Relies on `TestContext` from Node.js built-in test runner appearing in the stack
    const matchRes = String(new Error().stack).match(
      /\n\s+at (?:async )?TestContext.* \((.*):\d+:\d+\)\n/
    );

    return matchRes?.[1]
      ? path.relative(process.cwd(), matchRes[1] || '')
      : 'unknown';
  }
}
