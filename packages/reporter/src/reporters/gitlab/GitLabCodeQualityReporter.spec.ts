import 'reflect-metadata';
import { GitLabCodeQualityReporter } from './GitLabCodeQualityReporter';
import { GitLabReportSender, GITLAB_REPORT_SENDER, GITLAB_CONFIG } from './api';
import { HttpMethod, Issue, Scan, Severity } from '@sectester/scan';
import { container } from 'tsyringe';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { randomUUID } from 'node:crypto';

const issue: Issue = {
  id: randomUUID(),
  certainty: true,
  details: 'Cross-site request forgery is a type of malicious website exploit.',
  name: 'Database connection crashed',
  severity: Severity.MEDIUM,
  protocol: 'http',
  remedy:
    'The best way to protect against those kind of issues is making sure the Database resources are sufficient',
  cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L',
  time: new Date(),
  originalRequest: {
    method: HttpMethod.GET,
    url: 'https://brokencrystals.com/'
  },
  request: {
    method: HttpMethod.GET,
    url: 'https://brokencrystals.com/'
  },
  link: 'https://app.brightsec.com/scans/pDzxcEXQC8df1fcz1QwPf9/issues/pDzxcEXQC8df1fcz1QwPf9'
};

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
