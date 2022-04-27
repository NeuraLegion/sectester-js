import 'reflect-metadata';
import { Scans } from './Scans';
import { ScanFactory } from './ScanFactory';
import { Module, TestType } from './models';
import {
  anything,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { Configuration } from '@secbox/core';
import { DependencyContainer } from 'tsyringe';

describe('ScanFactory', () => {
  const mockedScans = mock<Scans>();
  const mockedConfiguration = mock<Configuration>();
  const mockedDependencyContainer = mock<DependencyContainer>();
  let scanFactory!: ScanFactory;

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(
      instance(mockedDependencyContainer)
    );
    when(mockedConfiguration.name).thenReturn('test');
    when(mockedConfiguration.version).thenReturn('1.0');
    when(mockedDependencyContainer.resolve<Scans>(Scans)).thenReturn(
      instance(mockedScans)
    );

    scanFactory = new ScanFactory(instance(mockedConfiguration));
  });

  afterEach(() =>
    reset<Scans | Configuration>(mockedScans, mockedConfiguration)
  );

  describe('createScan', () => {
    it('should create Scan', async () => {
      const scanId = 'roMq1UVuhPKkndLERNKnA8';
      const harId = 'upmVm5iPkddvzY6RisT7Cr';
      const scanSettings = {
        name: 'test',
        target: { url: 'https://example.com' },
        tests: [TestType.DOM_XSS]
      };
      when(mockedScans.uploadHar(anything())).thenResolve({ id: harId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      const result = await scanFactory.createScan(scanSettings);

      verify(mockedScans.uploadHar(anything())).once();
      verify(
        mockedScans.createScan(
          objectContaining({
            fileId: harId,
            module: Module.DAST,
            name: scanSettings.name,
            tests: scanSettings.tests
          })
        )
      ).once();

      expect(result).toMatchObject({ id: scanId });
    });

    it('should throw if har uploading failed', async () => {
      const scanId = 'roMq1UVuhPKkndLERNKnA8';
      const harId = 'upmVm5iPkddvzY6RisT7Cr';
      const scanSettings = {
        name: 'test',
        target: { url: 'https://example.com' },
        tests: [TestType.DOM_XSS]
      };
      when(mockedScans.uploadHar(anything())).thenThrow();
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      const result = scanFactory.createScan(scanSettings);

      await expect(result).rejects.toThrow();
      verify(mockedScans.uploadHar(anything())).once();
      verify(
        mockedScans.createScan(
          objectContaining({
            fileId: harId,
            module: Module.DAST,
            name: scanSettings.name,
            tests: scanSettings.tests,
            crawlerUrls: 'https://example.com'
          })
        )
      ).never();
    });
  });
});
