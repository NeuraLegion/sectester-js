import 'reflect-metadata';
import { GitHubCheckRunReporter } from './GitHubCheckRunReporter';
import { GitHubClient, GITHUB_CLIENT, GITHUB_CONFIG } from './api';
import { HttpMethod, Issue, Scan, Severity } from '@sectester/scan';
import { container } from 'tsyringe';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';

const issue: Issue = {
  id: 'pDzxcEXQC8df1fcz1QwPf9',
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
  link: 'https://app.neuralegion.com/scans/pDzxcEXQC8df1fcz1QwPf9/issues/pDzxcEXQC8df1fcz1QwPf9'
};

describe('GitHubCheckRunReporter', () => {
  let reporter: GitHubCheckRunReporter;
  const mockedScan = mock<Scan>();
  const mockedGitHubClient = mock<GitHubClient>();

  const mockConfig = {
    token: 'test-token',
    repository: 'owner/repo',
    commitSha: 'abc123'
  };

  beforeEach(() => {
    container.clearInstances();

    container.register(GITHUB_CONFIG, { useValue: mockConfig });
    container.register(GITHUB_CLIENT, {
      useValue: instance(mockedGitHubClient)
    });

    reporter = container.resolve(GitHubCheckRunReporter);
  });

  afterEach(() => {
    reset<Scan>(mockedScan);
    reset<GitHubClient>(mockedGitHubClient);
  });

  describe('constructor', () => {
    it('should throw error if token is not set', () => {
      expect(
        () =>
          new GitHubCheckRunReporter(
            { ...mockConfig, token: '' },
            instance(mockedGitHubClient)
          )
      ).toThrow('GitHub token is not set');
    });

    it('should throw error if repository is not set', () => {
      expect(
        () =>
          new GitHubCheckRunReporter(
            { ...mockConfig, repository: '' },
            instance(mockedGitHubClient)
          )
      ).toThrow('GitHub repository is not set');
    });

    it('should throw error if commitSha is not set', () => {
      expect(
        () =>
          new GitHubCheckRunReporter(
            { ...mockConfig, commitSha: '' },
            instance(mockedGitHubClient)
          )
      ).toThrow('GitHub commitSha is not set');
    });
  });

  describe('report', () => {
    it('should not create check run if there are no issues', async () => {
      when(mockedScan.issues()).thenResolve([]);

      await reporter.report(instance(mockedScan));

      verify(mockedGitHubClient.createCheckRun(anything())).never();
    });

    it('should create check run with single issue', async () => {
      when(mockedScan.issues()).thenResolve([issue] as Issue[]);
      when(mockedGitHubClient.createCheckRun(anything())).thenResolve();

      await reporter.report(instance(mockedScan));

      verify(mockedGitHubClient.createCheckRun(anything())).once();
    });

    it('should create check run with multiple issues', async () => {
      when(mockedScan.issues()).thenResolve([issue, issue] as Issue[]);
      when(mockedGitHubClient.createCheckRun(anything())).thenResolve();

      await reporter.report(instance(mockedScan));

      verify(mockedGitHubClient.createCheckRun(anything())).once();
    });
  });
});
