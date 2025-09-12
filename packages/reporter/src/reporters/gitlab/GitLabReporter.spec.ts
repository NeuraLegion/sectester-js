import 'reflect-metadata';
import { GitLabReporter } from './GitLabReporter';
import { GitLabCIArtifacts, GITLAB_CI_ARTIFACTS, GITLAB_CONFIG } from './api';
import { fullyDescribedIssue } from '../../__fixtures__/issues';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { CodeQualityReport } from './types';
import { Issue, Scan } from '@sectester/scan';
import { container } from 'tsyringe';
import {
  anything,
  deepEqual,
  instance,
  mock,
  reset,
  verify,
  when
} from 'ts-mockito';
import { createHash } from 'node:crypto';

describe('GitLabReporter', () => {
  let reporter: GitLabReporter;
  const mockedScan = mock<Scan>();
  const mockedGitLabCIArtifacts = mock<GitLabCIArtifacts>();
  const mockedTestFilePathResolver = mock<TestFilePathResolver>();

  const createMockConfig = (reportFormat?: string) => ({
    codeQualityReportFilename: 'gl-code-quality-report.json',
    testReportFilename: 'gl-test-report.xml',
    ...(reportFormat && { reportFormat })
  });

  beforeEach(() => {
    container.clearInstances();

    container.register(GITLAB_CI_ARTIFACTS, {
      useValue: instance(mockedGitLabCIArtifacts)
    });
    container.register(TEST_FILE_PATH_RESOLVER, {
      useValue: instance(mockedTestFilePathResolver)
    });

    when(mockedTestFilePathResolver.getTestFilePath()).thenReturn(
      'test.spec.ts'
    );
  });

  afterEach(() => {
    reset<Scan | GitLabCIArtifacts | TestFilePathResolver>(
      mockedScan,
      mockedGitLabCIArtifacts,
      mockedTestFilePathResolver
    );
  });

  describe('report', () => {
    it('should not generate any reports when there are no issues', async () => {
      // arrange
      container.register(GITLAB_CONFIG, { useValue: createMockConfig() });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([]);

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).never();
      verify(mockedGitLabCIArtifacts.writeTestReport(anything())).never();
    });

    it('should generate both reports by default when there are issues', async () => {
      // arrange
      container.register(GITLAB_CONFIG, { useValue: createMockConfig() });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).thenResolve();
      when(mockedGitLabCIArtifacts.writeTestReport(anything())).thenResolve();

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(mockedGitLabCIArtifacts.writeCodeQualityReport(anything())).once();
      verify(mockedGitLabCIArtifacts.writeTestReport(anything())).once();
    });

    it('should generate both reports when reportFormat is "both"', async () => {
      // arrange
      container.register(GITLAB_CONFIG, { useValue: createMockConfig('both') });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).thenResolve();
      when(mockedGitLabCIArtifacts.writeTestReport(anything())).thenResolve();

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(mockedGitLabCIArtifacts.writeCodeQualityReport(anything())).once();
      verify(mockedGitLabCIArtifacts.writeTestReport(anything())).once();
    });

    it('should generate only code quality report when reportFormat is "code-quality"', async () => {
      // arrange
      container.register(GITLAB_CONFIG, {
        useValue: createMockConfig('code-quality')
      });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).thenResolve();

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(mockedGitLabCIArtifacts.writeCodeQualityReport(anything())).once();
      verify(mockedGitLabCIArtifacts.writeTestReport(anything())).never();
    });

    it('should generate only test report when reportFormat is "test"', async () => {
      // arrange
      container.register(GITLAB_CONFIG, { useValue: createMockConfig('test') });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(mockedGitLabCIArtifacts.writeTestReport(anything())).thenResolve();

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).never();
      verify(mockedGitLabCIArtifacts.writeTestReport(anything())).once();
    });

    it('should generate correct code quality report structure', async () => {
      // arrange
      container.register(GITLAB_CONFIG, {
        useValue: createMockConfig('code-quality')
      });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).thenResolve();

      const expectedFingerprint = createHash('md5')
        .update(
          `${fullyDescribedIssue.name}-${fullyDescribedIssue.entryPointId}`
        )
        .digest('hex');

      const expectedReport: CodeQualityReport = [
        {
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
        }
      ];

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(
        mockedGitLabCIArtifacts.writeCodeQualityReport(
          deepEqual(expectedReport)
        )
      ).once();
    });

    it('should generate correct test report structure', async () => {
      // arrange
      container.register(GITLAB_CONFIG, { useValue: createMockConfig('test') });
      reporter = container.resolve(GitLabReporter);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(mockedGitLabCIArtifacts.writeTestReport(anything())).thenResolve();

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(mockedGitLabCIArtifacts.writeTestReport(anything())).once();
    });

    it('should use test file path from resolver', async () => {
      // arrange
      const customPath = 'custom/test/path.spec.ts';
      container.register(GITLAB_CONFIG, {
        useValue: createMockConfig('code-quality')
      });
      reporter = container.resolve(GitLabReporter);

      when(mockedTestFilePathResolver.getTestFilePath()).thenReturn(customPath);
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
      when(
        mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
      ).thenResolve();

      const expectedFingerprint = createHash('md5')
        .update(
          `${fullyDescribedIssue.name}-${fullyDescribedIssue.entryPointId}`
        )
        .digest('hex');

      const expectedReport: CodeQualityReport = [
        {
          description: `${fullyDescribedIssue.name} vulnerability found at ${fullyDescribedIssue.originalRequest.method.toUpperCase()} ${fullyDescribedIssue.originalRequest.url}`,
          fingerprint: expectedFingerprint,
          check_name: fullyDescribedIssue.name,
          severity: 'major',
          raw_details: JSON.stringify(fullyDescribedIssue, null, 2),
          location: {
            path: customPath,
            lines: {
              begin: 1
            }
          }
        }
      ];

      // act
      await reporter.report(instance(mockedScan));

      // assert
      verify(
        mockedGitLabCIArtifacts.writeCodeQualityReport(
          deepEqual(expectedReport)
        )
      ).once();
    });
  });
});
