import 'reflect-metadata';
import { GitLabCodeQualityReporter } from './GitLabCodeQualityReporter';
import { GitLabReportSender, GITLAB_REPORT_SENDER, GITLAB_CONFIG } from './api';
import { fullyDescribedIssue } from '../../__fixtures__/issues';
import { Issue, Scan } from '@sectester/scan';
import { container } from 'tsyringe';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';

const issue = fullyDescribedIssue;

describe('GitLabCodeQualityReporter', () => {
  let reporter: GitLabCodeQualityReporter;
  const mockedScan = mock<Scan>();
  const mockedGitLabReportSender = mock<GitLabReportSender>();

  const mockConfig = {};

  beforeEach(() => {
    container.clearInstances();

    container.register(GITLAB_CONFIG, { useValue: mockConfig });
    container.register(GITLAB_REPORT_SENDER, {
      useValue: instance(mockedGitLabReportSender)
    });

    reporter = container.resolve(GitLabCodeQualityReporter);
  });

  afterEach(() => {
    reset<Scan>(mockedScan);
    reset<GitLabReportSender>(mockedGitLabReportSender);
  });

  describe('report', () => {
    it('should not send code quality report when there are no issues', async () => {
      when(mockedScan.issues()).thenResolve([]);

      await reporter.report(instance(mockedScan));

      verify(
        mockedGitLabReportSender.sendCodeQualityReport(anything())
      ).never();
    });

    it('should send code quality report when there are issues', async () => {
      when(mockedScan.issues()).thenResolve([issue] as Issue[]);
      when(
        mockedGitLabReportSender.sendCodeQualityReport(anything())
      ).thenResolve();

      await reporter.report(instance(mockedScan));

      verify(mockedGitLabReportSender.sendCodeQualityReport(anything())).once();
    });
  });
});
