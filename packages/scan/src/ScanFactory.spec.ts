import 'reflect-metadata';
import { Scans } from './Scans';
import { ScanFactory } from './ScanFactory';
import { ScanSettingsOptions } from './ScanSettings';
import { Discoveries } from './Discoveries';
import {
  anything,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { Configuration, Logger } from '@sectester/core';
import { DependencyContainer } from 'tsyringe';
import { randomUUID } from 'crypto';

describe('ScanFactory', () => {
  const scanId = randomUUID();
  const entrypointId = randomUUID();
  const projectId = randomUUID();

  const mockedScans = mock<Scans>();
  const mockedConfiguration = mock<Configuration>();
  const mockedContainer = mock<DependencyContainer>();
  const mockedDiscoveries = mock<Discoveries>();
  const mockedLogger = mock<Logger>();
  let scanFactory!: ScanFactory;

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));
    when(mockedConfiguration.projectId).thenReturn(projectId);
    when(mockedContainer.createChildContainer()).thenReturn(
      instance(mockedContainer)
    );
    when(mockedContainer.resolve<Scans>(Scans)).thenReturn(
      instance(mockedScans)
    );
    when(mockedContainer.resolve<Discoveries>(Discoveries)).thenReturn(
      instance(mockedDiscoveries)
    );
    when(mockedContainer.resolve<Logger>(Logger)).thenReturn(
      instance(mockedLogger)
    );

    scanFactory = new ScanFactory(instance(mockedConfiguration));
  });

  afterEach(() =>
    reset<Scans | Configuration | DependencyContainer | Discoveries | Logger>(
      mockedScans,
      mockedConfiguration,
      mockedContainer,
      mockedDiscoveries,
      mockedLogger
    )
  );

  describe('createScan', () => {
    it('should create a scan', async () => {
      const settings: ScanSettingsOptions = {
        name: 'Test Scan',
        target: { url: 'https://example.com' },
        tests: ['xss']
      };

      when(
        mockedDiscoveries.createEntrypoint(anything(), anything())
      ).thenResolve({ id: entrypointId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      const result = await scanFactory.createScan(settings);

      verify(mockedDiscoveries.createEntrypoint(anything(), undefined)).once();
      verify(
        mockedScans.createScan(
          objectContaining({
            projectId,
            name: 'Test Scan',
            entryPointIds: [entrypointId],
            tests: ['xss']
          })
        )
      ).once();
      expect(result).toMatchObject({ id: scanId });
    });

    it('should create entrypoint from target', async () => {
      const settings: ScanSettingsOptions = {
        target: { url: 'https://example.com' },
        tests: ['xss']
      };

      when(
        mockedDiscoveries.createEntrypoint(anything(), anything())
      ).thenResolve({ id: entrypointId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      await scanFactory.createScan(settings);

      verify(
        mockedDiscoveries.createEntrypoint(
          objectContaining({ url: 'https://example.com/' }),
          undefined
        )
      ).once();
    });

    it('should pass repeater ID when provided', async () => {
      const repeaterId = randomUUID();
      const settings: ScanSettingsOptions = {
        repeaterId,
        target: { url: 'https://example.com' },
        tests: ['xss']
      };

      when(
        mockedDiscoveries.createEntrypoint(anything(), anything())
      ).thenResolve({ id: entrypointId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      await scanFactory.createScan(settings);

      verify(mockedDiscoveries.createEntrypoint(anything(), repeaterId)).once();

      verify(
        mockedScans.createScan(
          objectContaining({
            repeaters: [repeaterId]
          })
        )
      ).once();
    });

    it('should pass starMetadata when provided', async () => {
      const starMetadataObject = { key: 'value' };
      const settings: ScanSettingsOptions = {
        target: { url: 'https://example.com' },
        tests: ['xss'],
        starMetadata: starMetadataObject
      };

      when(
        mockedDiscoveries.createEntrypoint(anything(), anything())
      ).thenResolve({ id: entrypointId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      await scanFactory.createScan(settings);

      verify(
        mockedScans.createScan(
          objectContaining({
            starMetadata: starMetadataObject
          })
        )
      ).once();
    });
  });
});
