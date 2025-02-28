import { Scans } from './Scans';
import { Scan } from './Scan';
import { ScanConfig } from './models';
import { ScanSettings, ScanSettingsOptions } from './ScanSettings';
import { Target } from './target';
import { Configuration, Logger } from '@sectester/core';
import { DependencyContainer } from 'tsyringe';

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
    const { id: entrypointId } = await this.scans.createEntrypoint(
      new Target(target),
      repeaterId
    );

    return {
      name,
      smart,
      poolSize,
      skipStaticParams,
      slowEpTimeout,
      targetTimeout,
      entryPointIds: [entrypointId],
      attackParamLocations: [...attackParamLocations],
      tests: [...tests],
      repeaters: repeaterId ? [repeaterId] : undefined
    };
  }
}
