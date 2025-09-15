import type { CodeQualityReport, TestReport } from '../types';
import type { GitLabCIArtifacts } from './GitLabCIArtifacts';
import type { GitLabConfig } from './GitLabConfig';
import { GITLAB_CONFIG } from './GitLabConfig';
import { buildJUnitXML } from '../utils';
import { injectable, inject } from 'tsyringe';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';

@injectable()
export class GitLabCIArtifactsFileWriter implements GitLabCIArtifacts {
  constructor(@inject(GITLAB_CONFIG) private readonly config: GitLabConfig) {}

  public async writeCodeQualityReport(
    report: CodeQualityReport
  ): Promise<void> {
    // This method writes GitLab Code Quality reports to a file.
    // To display these reports in GitLab merge requests, you need to configure your .gitlab-ci.yml:
    //   artifacts:
    //     reports:
    //       codequality: gl-code-quality-report.json
    const reportJson = JSON.stringify(report, null, 2);
    const filename = this.config.codeQualityReportFilename;
    await writeFile(filename, reportJson, 'utf-8');
  }

  public async writeTestReport(report: TestReport): Promise<void> {
    const fileName = this.generateUniqueFileName();
    // This method writes GitLab Test reports in JUnit XML format to a file.
    // To display these reports in GitLab merge requests, you need to configure your .gitlab-ci.yml:
    //   artifacts:
    //     reports:
    //       junit: gl-test-report-*.xml
    // Note: Filenames are automatically made unique for concurrent test runs
    const reportXml = buildJUnitXML(report);
    await writeFile(fileName, reportXml, 'utf-8');
  }

  private generateUniqueFileName(): string {
    const ext = extname(this.config.testReportFilename);
    const baseName = basename(this.config.testReportFilename, ext);
    const fileName = `${baseName}-${randomUUID()}.${ext}`;

    return fileName;
  }
}
