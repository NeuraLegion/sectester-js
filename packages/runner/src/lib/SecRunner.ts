import { SecScanOptions } from './SecScanOptions';
import { SecScan } from './SecScan';
import { Configuration, ConfigurationOptions } from '@secbox/core';
import { Repeater, RepeaterFactory, RepeatersManager } from '@secbox/repeater';

export class SecRunner {
  private readonly configuration: Configuration;
  private repeater: Repeater | undefined;
  private repeaterFactory: RepeaterFactory;
  private repeatersManager: RepeatersManager;

  get repeaterId(): string | undefined {
    return this.repeater?.repeaterId;
  }

  constructor(config: Configuration | ConfigurationOptions) {
    this.configuration =
      config instanceof Configuration ? config : new Configuration(config);
    this.repeatersManager =
      this.configuration.container.resolve(RepeatersManager);
    this.repeaterFactory =
      this.configuration.container.resolve(RepeaterFactory);
  }

  public async init(): Promise<void> {
    if (this.repeater) {
      throw new Error('Already initialized.');
    }

    this.repeater = await this.repeaterFactory.createRepeater();

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
