import { SecScanOptions } from './SecScanOptions';
import { SecScan } from './SecScan';
import {
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig
} from '@secbox/bus';
import {
  CommandDispatcher,
  Configuration,
  ConfigurationOptions
} from '@secbox/core';
import { Repeater, RepeaterFactory, RepeatersManager } from '@secbox/repeater';
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
      this.repeater = undefined;
      this.repeatersManager = undefined;
      this.repeaterFactory = undefined;
    }
  }

  public createScan(options: SecScanOptions): SecScan {
    if (!this.repeater) {
      throw new Error('Must be initialized first.');
    }

    return new SecScan(this.configuration, {
      ...options,
      repeaterId: this.repeater.repeaterId
    });
  }

  private async initConfiguration(configuration: Configuration): Promise<void> {
    await configuration.loadCredentials();

    configuration.container.register(HttpCommandDispatcherConfig, {
      useValue: {
        baseUrl: configuration.api,
        token: configuration.credentials?.token as string
      }
    });

    configuration.container.register(CommandDispatcher, {
      useClass: HttpCommandDispatcher
    });

    configuration.container.register(RepeaterFactory, {
      useValue: new RepeaterFactory(configuration)
    });

    configuration.container.register(ScanFactory, {
      useValue: new ScanFactory(configuration)
    });
  }
}
