import { SecScanOptions } from './SecScanOptions';
import { SecScan } from './SecScan';
import { Configuration, ConfigurationOptions, Logger } from '@sectester/core';
import {
  Repeater,
  RepeaterFactory,
  RepeatersManager
} from '@sectester/repeater';
import { ScanFactory } from '@sectester/scan';
import {
  Formatter,
  GitHubCheckRunReporter,
  GitLabCodeQualityReporter,
  PlainTextFormatter,
  Reporter,
  StdReporter
} from '@sectester/reporter';

export class SecRunner {
  public static readonly SHUTDOWN_SIGNALS: readonly string[] = [
    'SIGTERM',
    'SIGINT',
    'SIGHUP'
  ];
  private readonly configuration: Configuration;
  private readonly logger: Logger;
  private repeater: Repeater | undefined;
  private repeaterFactory: RepeaterFactory | undefined;
  private repeatersManager: RepeatersManager | undefined;

  get repeaterId(): string | undefined {
    return this.repeater?.repeaterId;
  }

  constructor(config: Configuration | ConfigurationOptions) {
    this.configuration =
      config instanceof Configuration ? config : new Configuration(config);
    this.logger = this.configuration.container.resolve(Logger);
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

    this.setupShutdown();

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
      this.removeShutdownHandler();
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
      this.configuration.container.resolve<Formatter>(Formatter),
      this.configuration.container.resolve<Reporter>(Reporter)
    );
  }

  private async initConfiguration(configuration: Configuration): Promise<void> {
    await configuration.loadCredentials();
    await configuration.fetchProjectId();

    configuration.container.register(Formatter, {
      useClass: PlainTextFormatter
    });

    if (process.env.GITHUB_ACTIONS === 'true') {
      configuration.container.register(Reporter, {
        useClass: GitHubCheckRunReporter
      });
    } else if (process.env.CI && process.env.GITLAB_CI === 'true') {
      configuration.container.register(Reporter, {
        useClass: GitLabCodeQualityReporter
      });
    } else {
      configuration.container.register(Reporter, {
        useClass: StdReporter
      });
    }
  }

  private setupShutdown(): void {
    SecRunner.SHUTDOWN_SIGNALS.forEach(event =>
      process.once(event, this.beforeShutdownSignalHandler)
    );
  }

  private removeShutdownHandler(): void {
    SecRunner.SHUTDOWN_SIGNALS.forEach(event =>
      process.removeListener(event, this.beforeShutdownSignalHandler)
    );
  }

  private readonly beforeShutdownSignalHandler = async () => {
    try {
      await this.clear();
    } catch (e) {
      this.logger.error(e.message);
    }
  };
}
