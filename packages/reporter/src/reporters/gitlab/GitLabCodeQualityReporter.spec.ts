import 'reflect-metadata';
import { GitLabCodeQualityReporter } from './GitLabCodeQualityReporter';
import { GitLabCIArtifacts, GITLAB_CI_ARTIFACTS, GITLAB_CONFIG } from './api';
import { fullyDescribedIssue } from '../../__fixtures__/issues';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { CodeQualityReport } from './types/CodeQualityReport';
import { Issue, Scan } from '@sectester/scan';
import { container } from 'tsyringe';
import { createHash } from 'node:crypto';
import {
  anything,
  deepEqual,
  instance,
  mock,
  reset,
  verify,
  when
} from 'ts-mockito';

describe('GitLabCodeQualityReporter', () => {
  let reporter: GitLabCodeQualityReporter;
  const mockedScan = mock<Scan>();
  const mockedGitLabCIArtifacts = mock<GitLabCIArtifacts>();
  const mockedTestFilePathResolver = mock<TestFilePathResolver>();

  const mockConfig = {};

  beforeEach(() => {
    container.clearInstances();

    container.register(GITLAB_CONFIG, { useValue: mockConfig });
    container.register(GITLAB_CI_ARTIFACTS, {
      useValue: instance(mockedGitLabCIArtifacts)
    });
    container.register(TEST_FILE_PATH_RESOLVER, {
      useValue: instance(mockedTestFilePathResolver)
    });

    when(mockedTestFilePathResolver.getTestFilePath()).thenReturn(
      'test.spec.ts'
    );

    reporter = container.resolve(GitLabCodeQualityReporter);
  });

  afterEach(() => {
    reset<Scan | GitLabCIArtifacts | TestFilePathResolver>(
      mockedScan,
      mockedGitLabCIArtifacts,
      mockedTestFilePathResolver
    );
  });

  describe('report', () => {
    it('should not send code quality report when there are no issues', async () => {
      when(mockedScan.issues()).thenResolve([]);

      await reporter.report(instance(mockedScan));

      verify(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).never();
    });

    it('should send code quality report when there are issues', async () => {
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).thenResolve();

      const expectedFingerprint = createHash('md5')
        .update(`${fullyDescribedIssue.name}-${fullyDescribedIssue.entryPointId}`)
        .digest('hex');

      const expectedReport: CodeQualityReport = [{
        description: `${fullyDescribedIssue.name} vulnerability found at ${fullyDescribedIssue.originalRequest.method.toUpperCase()} ${fullyDescribedIssue.originalRequest.url}`,
        fingerprint: expectedFingerprint,
        check_name: fullyDescribedIssue.name,
        severity: 'major',
        raw_details: JSON.stringify(fullyDescribedIssue, null, 2),
        location: {
          path: 'test.spec.ts',
          lines: {
            begin: 1
          }
        }
      }];

      await reporter.report(instance(mockedScan));

      verify(mockedGitLabCIArtifacts.writeCodeQualityReport(deepEqual(expectedReport))).once();
    });
  });
});
