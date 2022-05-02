import { SecScan } from './SecScan';
import { resolvableInstance } from './SecRunner.spec';
import {
  Scan,
  ScanFactory,
  Severity,
  TargetOptions,
  TestType
} from '@secbox/scan';
import {
  anyFunction,
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

describe('SecScan', () => {
  const tests = [TestType.XSS];

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedScanFactory = mock<ScanFactory>();
  const mockedScan = mock<Scan>();

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedContainer.resolve<ScanFactory>(ScanFactory)).thenReturn(
      instance(mockedScanFactory)
    );

    when(mockedScanFactory.createScan(anything())).thenResolve(
      resolvableInstance(mockedScan)
    );

    when(mockedScan.expect(anything())).thenResolve();
    when(mockedScan.issues()).thenResolve([]);
  });

  afterEach(() => {
    reset<DependencyContainer | Configuration | ScanFactory | Scan>(
      mockedContainer,
      mockedConfiguration,
      mockedScanFactory,
      mockedScan
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

    it('should run scan with default threshold', async () => {
      const secScan = new SecScan(instance(mockedConfiguration), { tests });
      await secScan.run(target);

      verify(mockedScanFactory.createScan(objectContaining({ target }))).once();
      verify(mockedScan.expect(anyFunction())).once();
    });

    it('should run scan with latest set threshold', async () => {
      const secScan = new SecScan(instance(mockedConfiguration), { tests });

      secScan.threshold(Severity.MEDIUM);
      secScan.threshold(Severity.HIGH);
      await secScan.run({ url: 'http://foo.bar' });

      verify(mockedScanFactory.createScan(objectContaining({ target }))).once();
      verify(mockedScan.expect(Severity.HIGH)).once();
    });
  });
});
