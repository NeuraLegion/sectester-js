import { Scans } from './Scans';
import { Scan } from './Scan';
import { Discovery, Module, ScanConfig } from './models';
import { ScanSettings, ScanSettingsOptions } from './ScanSettings';
import { Target, TargetOptions } from './target';
import { Configuration, Logger, truncate } from '@sectester/core';
import { Entry, Har } from '@har-sdk/core';
import { DependencyContainer } from 'tsyringe';
import { randomUUID } from 'node:crypto';

export class ScanFactory {
  private readonly scans: Scans;
  private readonly container: DependencyContainer;
  private readonly logger: Logger;

  constructor(private readonly configuration: Configuration) {
    this.container = this.configuration.container.createChildContainer();
    this.scans = this.container.resolve(Scans);
    this.logger = this.container.resolve(Logger);
  }

  public async createScan(
    settings: ScanSettings | ScanSettingsOptions,
    options: {
      timeout?: number;
      pollingInterval?: number;
    } = {}
  ): Promise<Scan> {
    const config = await this.buildScanConfig(new ScanSettings(settings));
    const { id } = await this.scans.createScan(config);

    return new Scan({ id, logger: this.logger, scans: this.scans, ...options });
  }

  private async buildScanConfig({
    name,
    tests,
    target,
    repeaterId,
    smart,
    poolSize,
    targetTimeout,
    slowEpTimeout,
    skipStaticParams,
    attackParamLocations
  }: ScanSettings): Promise<ScanConfig> {
    const fileId = await this.createAndUploadHar(target);

    return {
      name,
      fileId,
      smart,
      poolSize,
      skipStaticParams,
      slowEpTimeout,
      targetTimeout,
      module: Module.DAST,
      discoveryTypes: [Discovery.ARCHIVE],
      attackParamLocations: [...attackParamLocations],
      tests: [...tests],
      repeaters: repeaterId ? [repeaterId] : undefined
    };
  }

  private async createAndUploadHar(
    target: Target | TargetOptions
  ): Promise<string> {
    const har = this.createHar(target);
    const filename = this.generateFilename(target.url);
    const { id } = await this.scans.uploadHar({
      har,
      filename,
      discard: true
    });

    return id;
  }

  private generateFilename(url: string): string {
    const { hostname } = new URL(url);
    const slug = truncate(hostname, 200);

    return `${slug}-${randomUUID()}.har`;
  }

  private createHarEntry(target: Target | TargetOptions): Entry {
    return {
      startedDateTime: new Date().toISOString(),
      request: new Target(target).toHarRequest(),
      response: {
        httpVersion: 'HTTP/1.1',
        status: 200,
        statusText: 'OK',
        headersSize: -1,
        bodySize: -1,
        content: {
          size: -1,
          mimeType: 'text/plain'
        },
        redirectURL: '',
        cookies: [],
        headers: []
      },
      cache: {},
      time: 0,
      timings: {
        send: 0,
        receive: 0,
        wait: 0
      }
    };
  }

  private createHar(target: Target | TargetOptions): Har {
    return {
      log: {
        version: '1.2',
        creator: {
          name: this.configuration.name,
          version: this.configuration.version
        },
        entries: [this.createHarEntry(target)]
      }
    };
  }
}
