import 'reflect-metadata';
import { GitLabReporter } from './GitLabReporter';
import { GitLabCIArtifacts, GITLAB_CI_ARTIFACTS, GITLAB_CONFIG } from './api';
import { fullyDescribedIssue } from '../../__fixtures__/issues';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { CodeQualityReport, GitLabConfig } from './types';
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
  const mockedGitLabConfig = mock<GitLabConfig>();

  beforeEach(() => {
    container.clearInstances();

    when(mockedGitLabConfig.codeQualityReportFilename).thenReturn(
      'gl-code-quality-report.json'
    );
    when(mockedGitLabConfig.testReportFilename).thenReturn(
      'gl-test-report.xml'
    );

    container.register(GITLAB_CONFIG, {
      useValue: instance(mockedGitLabConfig)
    });
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
    reset<Scan | GitLabCIArtifacts | TestFilePathResolver | GitLabConfig>(
      mockedScan,
      mockedGitLabCIArtifacts,
      mockedTestFilePathResolver,
      mockedGitLabConfig
    );
  });

  describe('report', () => {
    it('should not generate any reports when there are no issues', async () => {
      // arrange
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

    it('should generate only test report by default when there are issues', async () => {
      // arrange
      // Explicitly set reportFormat to undefined, which should default to 'test' per implementation
      when(mockedGitLabConfig.reportFormat).thenReturn(undefined);
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

    it('should generate both reports when reportFormat is "both"', async () => {
      // arrange
      when(mockedGitLabConfig.reportFormat).thenReturn('both');
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

    it.each(['code-quality', 'test'] as const)(
      `should generate only $reportFormat report when reportFormat is "$reportFormat"`,
      async reportFormat => {
        // arrange
        when(mockedGitLabConfig.reportFormat).thenReturn(reportFormat);
        reporter = container.resolve(GitLabReporter);
        when(mockedScan.issues()).thenResolve([fullyDescribedIssue] as Issue[]);
        when(
          mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
        ).thenResolve();

        // act
        await reporter.report(instance(mockedScan));

        // assert
        verify(
          mockedGitLabCIArtifacts.writeCodeQualityReport(anything())
        ).once();
        verify(mockedGitLabCIArtifacts.writeTestReport(anything())).never();
      }
    );

    it('should generate correct code quality report structure', async () => {
      // arrange
      when(mockedGitLabConfig.reportFormat).thenReturn('code-quality');
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
      when(mockedGitLabConfig.reportFormat).thenReturn('test');
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
      when(mockedGitLabConfig.reportFormat).thenReturn('code-quality');
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
