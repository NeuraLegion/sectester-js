import { Scans } from './Scans';
import { Scan } from './Scan';
import {
  AttackParamLocation,
  Discovery,
  Module,
  ScanConfig,
  TestType
} from './models';
import { ScanSettings } from './ScanSettings';
import { Target, TargetOptions } from './Target';
import { v4 } from 'uuid';
import { Configuration } from '@secbox/core';
import { Entry, Har } from '@har-sdk/core';

export class ScanFactory {
  private readonly scans: Scans;

  constructor(private readonly sdkConfig: Configuration) {
    this.scans = sdkConfig.container.resolve(Scans);
  }

  public async createScan(options: ScanSettings): Promise<Scan> {
    const scanConfig = await this.buildScanConfig(options);

    const { id } = await this.scans.createScan(scanConfig);

    return new Scan(id, this.scans);
  }

  // TODO: consider refactoring
  // eslint-disable-next-line complexity
  private async buildScanConfig({
    name,
    tests,
    target,
    repeaterId,
    smart = true,
    poolSize = 10,
    targetTimeout = 5,
    slowEpTimeout = 1000,
    skipStaticParams = true,
    attackParamLocations = [
      AttackParamLocation.BODY,
      AttackParamLocation.QUERY,
      AttackParamLocation.FRAGMENT
    ]
  }: ScanSettings): Promise<ScanConfig> {
    const fileId = await this.createAndUploadHar(target);

    if (tests.some((x: TestType) => !Object.values(TestType).includes(x))) {
      throw new Error('Unknown test type supplied.');
    }

    const uniqueTestTypes = new Set<TestType>(tests);

    if (uniqueTestTypes.size < 1) {
      throw new Error('Please provide a least one test.');
    }

    if (
      attackParamLocations.some(
        (x: AttackParamLocation) =>
          !Object.values(AttackParamLocation).includes(x)
      )
    ) {
      throw new Error('Unknown attack param location supplied.');
    }

    const uniqueAttackParamLocations = new Set<AttackParamLocation>(
      attackParamLocations
    );

    if (uniqueAttackParamLocations.size < 1) {
      throw new Error('Please provide a least one attack parameter location.');
    }

    if (isNaN(poolSize) || (poolSize > 50 && poolSize < 1)) {
      throw new Error('Invalid pool size.');
    }

    if (isNaN(slowEpTimeout) || slowEpTimeout < 100) {
      throw new Error('Invalid slow entry point timeout.');
    }

    if (isNaN(targetTimeout) || targetTimeout > 120 || targetTimeout <= 0) {
      throw new Error('Invalid target connection timeout.');
    }

    if (!fileId) {
      throw new Error('No HAR file configured.');
    }

    return {
      fileId,
      smart,
      poolSize,
      skipStaticParams,
      slowEpTimeout,
      targetTimeout,
      module: Module.DAST,
      discoveryTypes: [Discovery.ARCHIVE],
      name: name || `${target.method} ${target.url}`,
      attackParamLocations: [...uniqueAttackParamLocations],
      tests: [...uniqueTestTypes],
      repeaters: repeaterId ? [repeaterId] : undefined
    };
  }

  private async createAndUploadHar(
    target: Target | TargetOptions
  ): Promise<string> {
    const har = this.createHar(new Target(target));
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

  private createHarEntry(target: Target): Entry {
    return {
      startedDateTime: new Date().toISOString(),
      request: target.toHarRequest(),
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

  private createHar(target: Target): Har {
    return {
      log: {
        version: '1.2',
        creator: {
          name: this.sdkConfig.name,
          version: this.sdkConfig.version
        },
        entries: [this.createHarEntry(target)]
      }
    };
  }
}
