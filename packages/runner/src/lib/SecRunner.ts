import { SecScanOptions } from './SecScanOptions';
import { SecScan } from './SecScan';
import { Configuration, ConfigurationOptions } from '@secbox/core';
import { Repeater, RepeaterFactory, RepeatersManager } from '@secbox/repeater';
import { Reporter, StdReporter } from '@secbox/reporter';
import { ScanFactory } from '@secbox/scan';

export class SecRunner {
  private readonly configuration: Configuration;
  private repeater: Repeater | undefined;
  private repeaterFactory: RepeaterFactory | undefined;
  private repeatersManager: RepeatersManager | undefined;

  get repeaterId(): string | undefined {
    return this.repeater?.repeaterId;
  }

  constructor(config: Configuration | ConfigurationOptions) {
    this.configuration =
      config instanceof Configuration ? config : new Configuration(config);
  }

  public async init(): Promise<void> {
    if (this.repeatersManager && this.repeaterFactory) {
      throw new Error('Already initialized.');
    }

    await this.initConfiguration(this.configuration);

    this.repeatersManager =
      this.configuration.container.resolve(RepeatersManager);
    this.repeaterFactory =
      this.configuration.container.resolve(RepeaterFactory);

    this.repeater = await this.repeaterFactory.createRepeater();
    await this.repeater.start();
  }

  public async clear(): Promise<void> {
    try {
      if (this.repeater && this.repeatersManager) {
        await this.repeater.stop();
        await this.repeatersManager.deleteRepeater(this.repeater.repeaterId);
      }
    } finally {
      delete this.repeater;
      delete this.repeatersManager;
      delete this.repeaterFactory;
    }
  }

  public createScan(options: SecScanOptions): SecScan {
    if (!this.repeater) {
      throw new Error('Must be initialized first.');
    }

    return new SecScan(
      {
        ...options,
        repeaterId: this.repeater.repeaterId
      },
      this.configuration.container.resolve<ScanFactory>(ScanFactory),
      this.configuration.container.resolve<Reporter>(Reporter)
    );
  }

  private async initConfiguration(configuration: Configuration): Promise<void> {
    await configuration.loadCredentials();

    configuration.container.register(RepeaterFactory, {
      useValue: new RepeaterFactory(configuration)
    });

    configuration.container.register(ScanFactory, {
      useValue: new ScanFactory(configuration)
    });

    configuration.container.register(Reporter, {
      useClass: StdReporter
    });
  }
}
