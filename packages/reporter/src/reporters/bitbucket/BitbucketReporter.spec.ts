import 'reflect-metadata';
import { BitbucketReporter } from './BitbucketReporter';
import { BITBUCKET_CLIENT, BitbucketClient } from './api';
import {
  fullyDescribedIssue,
  issueWithoutResources
} from '../../__fixtures__/issues';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { Scan } from '@sectester/scan';
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
import { writeFile } from 'node:fs/promises';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

describe('BitbucketReporter', () => {
  let reporter: BitbucketReporter;
  const mockedScan = mock<Scan>();
  const mockedBitbucketClient = mock<BitbucketClient>();
  const mockedTestFilePathResolver = mock<TestFilePathResolver>();

  beforeEach(() => {
    container.clearInstances();

    container.register(BITBUCKET_CLIENT, {
      useValue: instance(mockedBitbucketClient)
    });
    container.register(TEST_FILE_PATH_RESOLVER, {
      useValue: instance(mockedTestFilePathResolver)
    });

    when(mockedTestFilePathResolver.getTestFilePath()).thenReturn(
      'test.spec.ts'
    );

    when(
      mockedBitbucketClient.createOrUpdateReport(anything(), anything())
    ).thenResolve();
    when(
      mockedBitbucketClient.createAnnotations(anything(), anything())
    ).thenResolve();

    reporter = container.resolve(BitbucketReporter);
  });

  afterEach(() => {
    reset<Scan | BitbucketClient | TestFilePathResolver>(
      mockedScan,
      mockedBitbucketClient,
      mockedTestFilePathResolver
    );
    jest.clearAllMocks();
  });

  describe('report', () => {
    it('should not submit anything when there are no issues', async () => {
      when(mockedScan.issues()).thenResolve([]);

      await reporter.report(instance(mockedScan));

      verify(
        mockedBitbucketClient.createOrUpdateReport(anything(), anything())
      ).never();
      verify(
        mockedBitbucketClient.createAnnotations(anything(), anything())
      ).never();
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should create report for a single issue', async () => {
      when(mockedScan.issues()).thenResolve([fullyDescribedIssue]);

      await reporter.report(instance(mockedScan));

      verify(
        mockedBitbucketClient.createOrUpdateReport(
          anything(),
          deepEqual({
            title: 'SecTester - GET /',
            details: fullyDescribedIssue.details,
            reporter: 'SecTester',
            report_type: 'SECURITY',
            result: 'FAILED',
            link: fullyDescribedIssue.link,
            data: [
              {
                title: 'Vulnerability',
                type: 'TEXT',
                value: fullyDescribedIssue.name
              },
              {
                title: 'Severity',
                type: 'TEXT',
                value: fullyDescribedIssue.severity
              }
            ]
          })
        )
      ).once();
      verify(
        mockedBitbucketClient.createAnnotations(
          anything(),
          deepEqual([
            {
              details: fullyDescribedIssue.details,
              link: fullyDescribedIssue.link,
              title: fullyDescribedIssue.name,
              external_id: fullyDescribedIssue.id,
              annotation_type: 'VULNERABILITY',
              summary: `${fullyDescribedIssue.name} vulnerability found at GET https://brokencrystals.com/`,
              result: 'FAILED',
              severity: 'MEDIUM',
              path: 'test.spec.ts',
              line: 1
            }
          ])
        )
      ).once();
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/^bb-test-report-.+\.xml$/),
        expect.stringContaining('<?xml'),
        'utf-8'
      );
    });

    it('should create report for multiple issues', async () => {
      const scanLink = `https://example.com/scan/${crypto.randomUUID()}`;
      when(mockedScan.link).thenReturn(scanLink);
      when(mockedScan.issues()).thenResolve([
        fullyDescribedIssue,
        issueWithoutResources
      ]);

      await reporter.report(instance(mockedScan));

      verify(
        mockedBitbucketClient.createOrUpdateReport(
          anything(),
          deepEqual({
            title: 'SecTester (2 issues)',
            details: 'SecTester found 2 issues',
            reporter: 'SecTester',
            link: scanLink,
            report_type: 'SECURITY',
            result: 'FAILED',
            data: [
              { title: 'Total Issues', type: 'NUMBER', value: 2 },
              { title: 'Medium', type: 'NUMBER', value: 2 }
            ]
          })
        )
      ).once();
      verify(
        mockedBitbucketClient.createAnnotations(
          anything(),
          deepEqual([
            {
              details: fullyDescribedIssue.details,
              link: fullyDescribedIssue.link,
              title: fullyDescribedIssue.name,
              external_id: fullyDescribedIssue.id,
              annotation_type: 'VULNERABILITY',
              summary: `${fullyDescribedIssue.name} vulnerability found at GET https://brokencrystals.com/`,
              result: 'FAILED',
              severity: 'MEDIUM',
              path: 'test.spec.ts',
              line: 1
            },
            {
              details: issueWithoutResources.details,
              link: issueWithoutResources.link,
              title: issueWithoutResources.name,
              external_id: issueWithoutResources.id,
              annotation_type: 'VULNERABILITY',
              summary: `${issueWithoutResources.name} vulnerability found at GET https://brokencrystals.com/`,
              result: 'FAILED',
              severity: 'MEDIUM',
              path: 'test.spec.ts',
              line: 1
            }
          ])
        )
      ).once();
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/^bb-test-report-.+\.xml$/),
        expect.stringContaining('<?xml'),
        'utf-8'
      );
    });
  });
});
