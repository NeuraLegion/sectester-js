import type { CodeQualityReport } from '../types';
import type { GitLabReportSender } from './GitLabReportSender';
import type { GitLabConfig } from './GitLabConfig';
import { GITLAB_CONFIG } from './GitLabConfig';
import { injectable, inject } from 'tsyringe';
import { writeFile } from 'node:fs/promises';

@injectable()
export class GitLabCodeQualityFileWriter implements GitLabReportSender {
  constructor(@inject(GITLAB_CONFIG) private readonly config: GitLabConfig) {}

  public async sendCodeQualityReport(report: CodeQualityReport): Promise<void> {
    // This method writes GitLab Code Quality reports to a file.
    // To display these reports in GitLab merge requests, you need to configure your .gitlab-ci.yml:
    //   artifacts:
    //     reports:
    //       codequality: gl-code-quality-report.json
    const reportJson = JSON.stringify(report, null, 2);
    const filename =
      this.config.codeQualityReportFilename || 'gl-code-quality-report.json';
    await writeFile(filename, reportJson, 'utf-8');
  }
}
