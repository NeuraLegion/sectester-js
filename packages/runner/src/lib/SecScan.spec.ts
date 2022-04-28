import { SecScan } from './SecScan';
import { ScanRunner, Severity, TargetOptions, TestType } from '../external';
import {
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
  const mockedScanRunner = mock<ScanRunner>();

  beforeEach(() => {
    when(mockedContainer.resolve<ScanRunner>(ScanRunner)).thenReturn(
      instance(mockedScanRunner)
    );

    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));
  });

  afterEach(() => {
    reset<DependencyContainer | Configuration | ScanRunner>(
      mockedContainer,
      mockedConfiguration,
      mockedScanRunner
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
    let scan!: SecScan;

    beforeEach(() => {
      scan = new SecScan(instance(mockedConfiguration), { tests });
    });

    it('should run scan with default threshold', async () => {
      await scan.run(target);

      verify(
        mockedScanRunner.run(objectContaining({ target }), undefined)
      ).once();
    });

    it('should run scan with latest set threshold', async () => {
      scan.threshold(Severity.MEDIUM);
      scan.threshold(Severity.HIGH);
      await scan.run({ url: 'http://foo.bar' });

      verify(
        mockedScanRunner.run(objectContaining({ target }), Severity.HIGH)
      ).once();
    });
  });
});
