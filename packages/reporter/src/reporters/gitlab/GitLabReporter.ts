import { Reporter } from '../../lib';
import { GITLAB_CI_ARTIFACTS, GITLAB_CONFIG } from './api';
import type { GitLabCIArtifacts, GitLabConfig } from './api';
import { CodeQualityReportBuilder, JUnitReportBuilder } from './builders';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';

@injectable()
export class GitLabReporter implements Reporter {
  constructor(
    @inject(GITLAB_CI_ARTIFACTS)
    private readonly gitlabCIArtifacts: GitLabCIArtifacts,
    @inject(GITLAB_CONFIG)
    private readonly config: GitLabConfig,
    @inject(TEST_FILE_PATH_RESOLVER)
    private readonly testFilePathResolver: TestFilePathResolver
  ) {}

  public async report(scan: Scan): Promise<void> {
    const issues = await scan.issues();

    if (issues.length > 0) {
      const reportFormat = this.config.reportFormat ?? 'test';

      switch (reportFormat) {
        case 'code-quality':
          await this.generateCodeQualityReport(issues);
          break;
        case 'test':
          await this.generateTestReport(issues);
          break;
        case 'both':
        default:
          await Promise.all([
            this.generateCodeQualityReport(issues),
            this.generateTestReport(issues)
          ]);
          break;
      }
    }
  }

  private async generateCodeQualityReport(issues: Issue[]): Promise<void> {
    const testFilePath = this.testFilePathResolver.getTestFilePath();
    const codeQualityReport = this.createCodeQualityReportBuilder(
      issues,
      testFilePath
    ).build();
    await this.gitlabCIArtifacts.writeCodeQualityReport(codeQualityReport);
  }

  private async generateTestReport(issues: Issue[]): Promise<void> {
    const testFilePath = this.testFilePathResolver.getTestFilePath();
    const testReport = this.createJUnitReportBuilder(
      issues,
      testFilePath
    ).build();
    await this.gitlabCIArtifacts.writeTestReport(testReport);
  }

  private createCodeQualityReportBuilder(
    issues: Issue[],
    testFilePath: string
  ): CodeQualityReportBuilder {
    return new CodeQualityReportBuilder(issues, testFilePath);
  }

  private createJUnitReportBuilder(
    issues: Issue[],
    testFilePath: string
  ): JUnitReportBuilder {
    return new JUnitReportBuilder(issues, testFilePath);
  }
}
