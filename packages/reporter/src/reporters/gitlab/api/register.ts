import 'reflect-metadata';
import { GitLabCodeQualityFileWriter } from './GitLabCodeQualityFileWriter';
import { GITLAB_REPORT_SENDER } from './GitLabReportSender';
import { GITLAB_CONFIG } from './GitLabConfig';
import { container } from 'tsyringe';

container.register(GITLAB_CONFIG, {
  useValue: {
    codeQualityReportFilename: process.env.GITLAB_CODE_QUALITY_REPORT_FILENAME || 'gl-code-quality-report.json'
  }
});

container.register(GITLAB_REPORT_SENDER, { useClass: GitLabCodeQualityFileWriter });
