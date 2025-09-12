import 'reflect-metadata';
import { GitLabCIArtifactsFileWriter } from './GitLabCodeQualityFileWriter';
import { GITLAB_CI_ARTIFACTS } from './GitLabCIArtifacts';
import { GITLAB_CONFIG } from './GitLabConfig';
import { container } from 'tsyringe';

container.register(GITLAB_CONFIG, {
  useValue: {
    codeQualityReportFilename:
      process.env.GITLAB_CODE_QUALITY_REPORT_FILENAME ||
      'gl-code-quality-report.json',
    testReportFilename:
      process.env.GITLAB_TEST_REPORT_FILENAME || 'gl-test-report.xml',
    reportFormat: (process.env.GITLAB_REPORT_FORMAT as any) || 'both'
  }
});

container.register(GITLAB_CI_ARTIFACTS, {
  useClass: GitLabCIArtifactsFileWriter
});
