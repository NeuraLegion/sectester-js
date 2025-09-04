import 'reflect-metadata';
import { GitHubCheckRunReporter } from './GitHubCheckRunReporter';
import { GitHubClient, GITHUB_CLIENT, GITHUB_CONFIG } from './api';
import { fullyDescribedIssue } from '../../__fixtures__/issues';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { Issue, Scan } from '@sectester/scan';
import { container } from 'tsyringe';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';

describe('GitHubCheckRunReporter', () => {
  let reporter: GitHubCheckRunReporter;
  const mockedScan = mock<Scan>();
  const mockedGitHubClient = mock<GitHubClient>();
  const mockedTestFilePathResolver = mock<TestFilePathResolver>();

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
    container.register(TEST_FILE_PATH_RESOLVER, {
      useValue: instance(mockedTestFilePathResolver)
    });

    when(mockedTestFilePathResolver.getTestFilePath()).thenReturn(
      'test.spec.ts'
    );

    reporter = container.resolve(GitHubCheckRunReporter);
  });

  afterEach(() => {
    reset<Scan>(mockedScan);
    reset<GitHubClient>(mockedGitHubClient);
    reset<TestFilePathResolver>(mockedTestFilePathResolver);
  });

  describe('constructor', () => {
    it('should throw error if token is not set', () => {
      expect(
        () =>
          new GitHubCheckRunReporter(
            { ...mockConfig, token: '' },
            instance(mockedGitHubClient),
            instance(mockedTestFilePathResolver)
          )
      ).toThrow('GitHub token is not set');
    });

    it('should throw error if repository is not set', () => {
      expect(
        () =>
          new GitHubCheckRunReporter(
            { ...mockConfig, repository: '' },
            instance(mockedGitHubClient),
            instance(mockedTestFilePathResolver)
          )
      ).toThrow('GitHub repository is not set');
    });

    it('should throw error if commitSha is not set', () => {
      expect(
        () =>
          new GitHubCheckRunReporter(
            { ...mockConfig, commitSha: '' },
            instance(mockedGitHubClient),
            instance(mockedTestFilePathResolver)
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
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(mockedGitHubClient.createCheckRun(anything())).thenResolve();

      await reporter.report(instance(mockedScan));

      verify(mockedGitHubClient.createCheckRun(anything())).once();
    });

    it('should create check run with multiple issues', async () => {
      when(mockedScan.issues()).thenResolve([
        fullyDescribedIssue,
        fullyDescribedIssue
      ] as Issue[]);
      when(mockedGitHubClient.createCheckRun(anything())).thenResolve();

      await reporter.report(instance(mockedScan));

      verify(mockedGitHubClient.createCheckRun(anything())).once();
    });
  });
});
