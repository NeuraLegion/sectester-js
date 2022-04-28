import { SecScanOptions } from './SecScanOptions';
import { SecScan } from './SecScan';
import { Configuration, ConfigurationOptions } from '@secbox/core';
import { Repeater, RepeaterFactory, RepeatersManager } from '@secbox/repeater';

export class SecRunner {
  private readonly configuration: Configuration;
  private repeater: Repeater | undefined;
  private repeatersManager: RepeatersManager;

  constructor(config: ConfigurationOptions) {
    this.configuration = new Configuration(config);
    this.repeatersManager =
      this.configuration.container.resolve(RepeatersManager);
  }

  public async init(): Promise<void> {
    if (this.repeater) {
      throw new Error('Already initialized.');
    }

    this.repeater = await new RepeaterFactory(
      this.configuration
    ).createRepeater();
    await this.repeater.start();
  }

  public async clear(): Promise<void> {
    try {
      if (this.repeater) {
        await this.repeater.stop();
        await this.repeatersManager.deleteRepeater(this.repeater.repeaterId);
      }
    } finally {
      this.repeater = undefined;
    }
  }

  public createScan(options: SecScanOptions): SecScan {
    return new SecScan({
      ...options,
      repeaterId: this.repeater?.repeaterId
    });
  }
}
