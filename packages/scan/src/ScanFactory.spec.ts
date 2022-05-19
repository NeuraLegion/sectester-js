import 'reflect-metadata';
import { Scans } from './Scans';
import { ScanFactory } from './ScanFactory';
import { Discovery, Module, TestType } from './models';
import { ScanSettingsOptions } from './ScanSettings';
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
import { Configuration } from '@sec-tester/core';
import { DependencyContainer } from 'tsyringe';
import { randomBytes } from 'crypto';

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
    when(mockedContainer.createChildContainer()).thenReturn(
      instance(mockedContainer)
    );
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
      const settings: ScanSettingsOptions = {
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
            name: 'GET example.com',
            module: Module.DAST,
            discoveryTypes: [Discovery.ARCHIVE],
            tests: [TestType.DOM_XSS]
          })
        )
      ).once();
      expect(result).toMatchObject({ id: scanId });
    });

    it('should generate and upload a HAR file', async () => {
      const settings: ScanSettingsOptions = {
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

    it('should truncate a HAR filename if it is too long', async () => {
      const settings: ScanSettingsOptions = {
        target: {
          url: `https://subdomain-${randomBytes(200).toString(
            'hex'
          )}.example.com`
        },
        tests: [TestType.DOM_XSS]
      };
      when(mockedScans.uploadHar(anything())).thenResolve({ id: fileId });
      when(mockedScans.createScan(anything())).thenResolve({ id: scanId });

      await scanFactory.createScan(settings);

      verify(
        mockedScans.uploadHar(
          deepEqual({
            discard: true,
            filename: match(/^.{0,200}-[a-z\d-]+\.har$/),
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
  });
});
