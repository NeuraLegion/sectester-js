import { SecScan } from './SecScan';
import { resolvableInstance } from './SecRunner.spec';
import {
  Issue,
  Scan,
  ScanFactory,
  Severity,
  TargetOptions,
  TestType
} from '@secbox/scan';
import {
  anything,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';
import { Configuration } from '@secbox/core';
import { Reporter } from '@secbox/reporter';

describe('SecScan', () => {
  const tests = [TestType.XSS];

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedScanFactory = mock<ScanFactory>();
  const mockedScan = mock<Scan>();
  const mockedReporter = mock<Reporter>();

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedContainer.resolve<ScanFactory>(ScanFactory)).thenReturn(
      instance(mockedScanFactory)
    );

    when(mockedContainer.resolve<Reporter>(Reporter)).thenReturn(
      instance(mockedReporter)
    );

    when(mockedScanFactory.createScan(anything())).thenResolve(
      resolvableInstance(mockedScan)
    );

    when(mockedScan.expect(anything())).thenResolve();
    when(mockedScan.issues()).thenResolve([]);
  });

  afterEach(() => {
    reset<DependencyContainer | Configuration | ScanFactory | Scan | Reporter>(
      mockedContainer,
      mockedConfiguration,
      mockedScanFactory,
      mockedScan,
      mockedReporter
    );
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(
        () => new SecScan(instance(mockedConfiguration), { tests })
      ).not.toThrowError();
    });
  });

  describe('run', () => {
    const target: TargetOptions = { url: 'http://foo.bar' };
    const issues: Issue[] = [
      {
        id: 'fooId'
      } as Issue
    ];

    let secScan!: SecScan;

    beforeEach(() => {
      secScan = new SecScan(instance(mockedConfiguration), { tests });
    });

    it('should run scan with default threshold', async () => {
      await secScan.run(target);

      verify(mockedScanFactory.createScan(objectContaining({ target }))).once();
      verify(mockedScan.expect(Severity.LOW)).once();
    });

    it('should run scan with latest set threshold', async () => {
      secScan.threshold(Severity.MEDIUM);
      secScan.threshold(Severity.HIGH);
      await secScan.run(target);

      verify(mockedScanFactory.createScan(objectContaining({ target }))).once();
      verify(mockedScan.expect(Severity.HIGH)).once();
    });

    it('should throw an error on found issues', async () => {
      when(mockedScan.issues()).thenResolve(issues);

      const res = secScan.run(target);

      await expect(res).rejects.toThrow('Target is vulnerable');
    });

    it('should stop scan after resolved expectation', async () => {
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
      when(mockedScan.issues()).thenResolve(issues);

      const res = secScan.run(target);

      await expect(res).rejects.toThrow();
      verify(mockedReporter.report(anything())).once();
    });

    it('should not report if there are not issues', async () => {
      await secScan.run(target);

      verify(mockedReporter.report(anything())).never();
    });
  });
});
