import { Scans } from './Scans';
import { Scan } from './Scan';
import { Discovery, Module, ScanConfig } from './models';
import { ScanSettings, ScanSettingsOptions } from './ScanSettings';
import { Target, TargetOptions } from './target';
import { v4 } from 'uuid';
import { Configuration } from '@secbox/core';
import { Entry, Har } from '@har-sdk/core';

export class ScanFactory {
  private readonly scans: Scans;

  constructor(private readonly configuration: Configuration) {
    this.scans = configuration.container.resolve(Scans);
  }

  public async createScan(
    options: ScanSettings | ScanSettingsOptions
  ): Promise<Scan> {
    const config = await this.buildScanConfig(new ScanSettings(options));
    const { id } = await this.scans.createScan(config);

    return new Scan({ id, scans: this.scans });
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

    return `${hostname}-${v4()}.har`;
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
