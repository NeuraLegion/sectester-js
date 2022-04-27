import 'reflect-metadata';
import { Scans } from './Scans';
import { ScanFactory } from './ScanFactory';
import { AttackParamLocation, Discovery, Module, TestType } from './models';
import { ScanSettings } from './ScanSettings';
import {
  anything,
  deepEqual,
  instance,
  match,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { Configuration } from '@secbox/core';
import { DependencyContainer } from 'tsyringe';

describe('ScanFactory', () => {
  const scanId = 'roMq1UVuhPKkndLERNKnA8';
  const fileId = 'upmVm5iPkddvzY6RisT7Cr';

  const mockedScans = mock<Scans>();
  const mockedConfiguration = mock<Configuration>();
  const mockedContainer = mock<DependencyContainer>();
  let scanFactory!: ScanFactory;

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));
    when(mockedConfiguration.name).thenReturn('test');
    when(mockedConfiguration.version).thenReturn('1.0');
    when(mockedContainer.resolve<Scans>(Scans)).thenReturn(
      instance(mockedScans)
    );

    scanFactory = new ScanFactory(instance(mockedConfiguration));
  });

  afterEach(() =>
    reset<Scans | Configuration | DependencyContainer>(
      mockedScans,
      mockedConfiguration,
      mockedContainer
    )
  );

  describe('createScan', () => {
    it('should create a scan', async () => {
      const settings: ScanSettings = {
        target: { url: 'https://example.com' },
        tests: [TestType.DOM_XSS]
      };
      when(mockedScans.uploadHar(anything())).thenResolve({ id: fileId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      const result = await scanFactory.createScan(settings);

      verify(mockedScans.uploadHar(anything())).once();
      verify(
        mockedScans.createScan(
          objectContaining({
            fileId,
            name: 'GET https://example.com/',
            module: Module.DAST,
            discoveryTypes: [Discovery.ARCHIVE],
            tests: [TestType.DOM_XSS]
          })
        )
      ).once();
      expect(result).toMatchObject({ id: scanId });
    });

    it('should create a scan with custom name', async () => {
      const settings: ScanSettings = {
        name: 'my scan',
        target: { url: 'https://example.com' },
        tests: [TestType.DOM_XSS]
      };
      when(mockedScans.uploadHar(anything())).thenResolve({ id: fileId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      const result = await scanFactory.createScan(settings);

      verify(mockedScans.uploadHar(anything())).once();
      verify(
        mockedScans.createScan(
          objectContaining({
            fileId,
            name: 'my scan',
            module: Module.DAST,
            discoveryTypes: [Discovery.ARCHIVE],
            tests: [TestType.DOM_XSS]
          })
        )
      ).once();
      expect(result).toMatchObject({ id: scanId });
    });

    it('should generate and upload a HAR file', async () => {
      const settings: ScanSettings = {
        target: { url: 'https://example.com' },
        tests: [TestType.DOM_XSS]
      };
      when(mockedScans.uploadHar(anything())).thenResolve({ id: fileId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      await scanFactory.createScan(settings);

      verify(
        mockedScans.uploadHar(
          deepEqual({
            discard: true,
            filename: match(/^example\.com-[a-z\d-]+\.har$/),
            har: objectContaining({
              log: {
                version: '1.2',
                creator: { name: 'test', version: '1.0' }
              }
            })
          })
        )
      ).once();
    });

    it('should create a scan with unique attack locations', async () => {
      const settings: ScanSettings = {
        target: { url: 'https://example.com' },
        tests: [TestType.XPATHI],
        attackParamLocations: [
          AttackParamLocation.QUERY,
          AttackParamLocation.QUERY
        ]
      };
      when(mockedScans.uploadHar(anything())).thenResolve({ id: fileId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      await scanFactory.createScan(settings);

      verify(
        mockedScans.createScan(
          objectContaining({
            attackParamLocations: [AttackParamLocation.QUERY]
          })
        )
      ).once();
    });

    it.each([
      {
        input: { tests: ['xxx' as unknown as TestType] },
        expected: 'Unknown test type supplied'
      },
      { input: { tests: [] }, expected: 'Please provide a least one test' },
      {
        input: {
          attackParamLocations: ['xxx' as AttackParamLocation]
        },
        expected: 'Unknown attack param location supplied'
      },
      {
        input: {
          attackParamLocations: []
        },
        expected: 'Please provide a least one attack parameter location'
      },
      {
        input: {
          poolSize: 51
        },
        expected: 'Invalid pool size'
      },
      {
        input: {
          poolSize: 0
        },
        expected: 'Invalid pool size'
      },
      {
        input: {
          slowEpTimeout: 1
        },
        expected: 'Invalid slow entry point timeout'
      },
      {
        input: {
          targetTimeout: 0
        },
        expected: 'Invalid target connection timeout'
      },
      {
        input: {
          targetTimeout: 121
        },
        expected: 'Invalid target connection timeout'
      }
    ])(
      'should raise the error `$expected` when invalid config ($input) is supplied',
      async ({ input, expected }) => {
        const settings: ScanSettings = {
          target: { url: 'https://example.com' },
          tests: [TestType.XPATHI],
          ...input
        };
        when(mockedScans.createScan(anything())).thenResolve({ id: scanId });
        when(mockedScans.uploadHar(anything())).thenResolve({ id: fileId });

        const result = scanFactory.createScan(settings);

        await expect(result).rejects.toThrow(expected);
      }
    );
  });
});
