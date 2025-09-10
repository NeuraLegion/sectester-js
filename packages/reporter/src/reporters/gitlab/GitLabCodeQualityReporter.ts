import { Reporter } from '../../lib';
import { GITLAB_CI_ARTIFACTS } from './api';
import type { GitLabCIArtifacts } from './api';
import { CodeQualityReportBuilder } from './builders';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';

@injectable()
export class GitLabCodeQualityReporter implements Reporter {
  constructor(
    @inject(GITLAB_CI_ARTIFACTS)
    private readonly gitlabCIArtifacts: GitLabCIArtifacts,
    @inject(TEST_FILE_PATH_RESOLVER)
    private readonly testFilePathResolver: TestFilePathResolver
  ) {}

  public async report(scan: Scan): Promise<void> {
    const issues = await scan.issues();

    if (issues.length > 0) {
      await this.generateCodeQualityReport(issues);
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

  private createCodeQualityReportBuilder(
    issues: Issue[],
    testFilePath: string
  ): CodeQualityReportBuilder {
    return new CodeQualityReportBuilder(issues, testFilePath);
  }
}
