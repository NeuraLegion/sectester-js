import { Module } from './enums';
import { ScanConfig, Scans, ScanSettings, Target } from './Scans';
import { Scan } from './Scan';
import { Har, HarEntryBuilder } from './HarEntryBuilder';
import { autoInjectable, inject } from 'tsyringe';
import { Configuration } from '@secbox/core';
import { v4 } from 'uuid';

@autoInjectable()
export class ScanFactory {
  constructor(
    @inject(Scans) private readonly scans: Scans,
    @inject(Configuration) private readonly sdkConfig: Configuration
  ) {}

  public async createScan(settings: ScanSettings): Promise<Scan> {
    const scanConfig: ScanConfig = await this.buildScanConfig(settings);

    const { id } = await this.scans.create(scanConfig);

    return new Scan(id, this.scans);
  }

  private async buildScanConfig(settings: ScanSettings): Promise<ScanConfig> {
    const fileId = await this.createFile(settings.target);

    return {
      fileId,
      module: Module.DAST,
      name: settings.name,
      smart: settings.smart,
      tests: settings.tests,
      poolSize: settings.poolSize,
      skipStaticParams: settings.skipStaticParams,
      attackParamLocations: settings.attackParamLocations,
      crawlerUrls: this.getCrawlerUrl(settings.target)
    };
  }

  private async createFile(target: Target): Promise<string> {
    const filename = this.generateFilename();
    const har = this.createHar(target);
    const { id } = await this.scans.uploadHar({
      filename,
      content: JSON.stringify(har)
    });

    return id;
  }

  private generateFilename(): string {
    return `${this.sdkConfig.name}-${v4()}.json`;
  }

  private createHar(target: Target): Har {
    const entry = new HarEntryBuilder(target.url, target.method)
      .setHeaders(target.headers)
      .setQuery(target.query)
      .postData(target.body)
      .build();

    return {
      log: {
        version: '1.2',
        creator: {
          name: this.sdkConfig.name,
          version: this.sdkConfig.version
        },
        entries: [entry]
      }
    };
  }

  private getCrawlerUrl(target: Target): string {
    if (!target.query) {
      return target.url;
    }

    let stringifiedQuery: string;

    if (target.serializeQuery) {
      stringifiedQuery = target.serializeQuery(target.query);
    } else {
      stringifiedQuery = new URLSearchParams(target.query).toString();
    }

    return `${target.url}?${stringifiedQuery}`;
  }
}
