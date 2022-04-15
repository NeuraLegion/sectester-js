import { Module } from './enums';
import { ScanConfig, Scans, ScanSettings, Target } from './Scans';
import { Scan } from './Scan';
import { autoInjectable, inject } from 'tsyringe';
import queryString from 'query-string';

@autoInjectable()
export class ScanFactory {
  constructor(@inject(Scans) private readonly scans: Scans) {}

  public async createScan(settings: ScanSettings): Promise<Scan> {
    const scanConfig: ScanConfig = this.buildScanConfig(settings);

    const { id } = await this.scans.create(scanConfig);

    return new Scan(id, this.scans);
  }

  private buildScanConfig(settings: ScanSettings): ScanConfig {
    return {
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

  private getCrawlerUrl(target: Target): string {
    if (!target.query) {
      return target.url;
    }

    let stringifiedQuery: string;

    if (target.serializeQuery) {
      stringifiedQuery = target.serializeQuery(target.query);
    } else if (target.query.toString() !== '[object Object]') {
      stringifiedQuery = target.query.toString();
    } else {
      stringifiedQuery = queryString.stringify(target.query);
    }

    return `${target.url}?${stringifiedQuery}`;
  }
}
