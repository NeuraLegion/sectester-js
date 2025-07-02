import { SecScan } from './SecScan';
import { resolvableInstance } from './SecRunner.spec';
import { IssueFound } from './IssueFound';
import {
  Issue,
  Scan,
  ScanFactory,
  Severity,
  TargetOptions
} from '@sectester/scan';
import {
  anything,
  deepEqual,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';
import { Configuration } from '@sectester/core';
import { Formatter } from '@sectester/reporter';

describe('SecScan', () => {
  const tests = ['xss'];

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedScanFactory = mock<ScanFactory>();
  const mockedScan = mock<Scan>();
  const mockedIssueFormatter = mock<Formatter>();

  const issueFormatter = instance(mockedIssueFormatter);
  const scanFactory = instance(mockedScanFactory);

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedScanFactory.createScan(anything(), anything())).thenResolve(
      resolvableInstance(mockedScan)
    );
  });

  afterEach(() => {
    reset<DependencyContainer | Configuration | ScanFactory | Scan | Formatter>(
      mockedContainer,
      mockedConfiguration,
      mockedScanFactory,
      mockedScan,
      mockedIssueFormatter
    );
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(
        () => new SecScan({ tests }, scanFactory, issueFormatter)
      ).not.toThrow();
    });
  });

  describe('run', () => {
    const target: TargetOptions = { url: 'http://foo.bar' };
    const issues: Issue[] = [
      {
        id: 'fooId',
        severity: Severity.HIGH
      } as Issue
    ];

    let secScan!: SecScan;

    beforeEach(() => {
      secScan = new SecScan({ tests }, scanFactory, issueFormatter);
    });

    it('should run scan with default threshold', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve([]);

      await secScan.run(target);

      verify(
        mockedScanFactory.createScan(objectContaining({ target }), anything())
      ).once();
      verify(
        mockedScan.expect(Severity.LOW, objectContaining({ failFast: true }))
      ).once();
    });

    it('should run scan with latest set threshold', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve([]);

      secScan.threshold(Severity.MEDIUM);
      secScan.threshold(Severity.HIGH);
      await secScan.run(target);

      verify(
        mockedScanFactory.createScan(objectContaining({ target }), anything())
      ).once();
      verify(
        mockedScan.expect(Severity.HIGH, objectContaining({ failFast: true }))
      ).once();
    });

    it('should run scan with provided timeout', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve([]);

      secScan.timeout(42);
      await secScan.run(target);

      verify(
        mockedScanFactory.createScan(
          objectContaining({ target }),
          deepEqual({ timeout: 42 })
        )
      ).once();
    });

    it('should throw an error on found issues', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve(issues);

      const res = secScan.run(target);

      await expect(res).rejects.toThrow(IssueFound);
    });

    it('should stop scan after resolved expectation', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve([]);

      await secScan.run(target);

      verify(mockedScan.stop()).once();
    });

    it('should stop scan on any error', async () => {
      when(mockedScan.expect(anything())).thenReject();

      const res = secScan.run(target);

      await expect(res).rejects.toThrow();
      verify(mockedScan.stop()).once();
    });

    it('should report if issues are found', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve(issues);

      const res = secScan.run(target);

      await expect(res).rejects.toThrow();
      verify(mockedIssueFormatter.format(anything())).once();
    });

    it('should not report if there are not issues', async () => {
      when(mockedScan.expect(anything(), anything())).thenResolve();
      when(mockedScan.issues()).thenResolve([]);

      await secScan.run(target);

      verify(mockedIssueFormatter.format(anything())).never();
    });

    it('should run scan without failing fast', async () => {
      when(
        mockedScan.expect(anything(), objectContaining({ failFast: false }))
      ).thenResolve();
      when(mockedScan.issues()).thenResolve([]);

      await secScan.setFailFast(false).run(target);

      verify(
        mockedScan.expect(anything(), objectContaining({ failFast: false }))
      ).once();
      verify(mockedScan.expect(anything())).never();
    });
  });
});
