import {
  ExecuteRequestEventHandler,
  RegisterRepeaterCommand,
  RegisterRepeaterResult,
  RepeaterRegisteringError,
  RepeaterStatusEvent
} from '../bus';
import { RepeaterStatus } from '../models';
import { Configuration, EventBus, Logger } from '@sec-tester/core';
import { gt } from 'semver';
import chalk from 'chalk';
import Timer = NodeJS.Timer;

export enum RunningStatus {
  OFF,
  STARTING,
  RUNNING
}

export class Repeater {
  public readonly repeaterId: string;

  private readonly bus: EventBus;
  private readonly configuration: Configuration;
  private readonly logger: Logger | undefined;

  private timer?: Timer;

  private _runningStatus = RunningStatus.OFF;

  get runningStatus(): RunningStatus {
    return this._runningStatus;
  }

  constructor({
    repeaterId,
    bus,
    configuration
  }: {
    repeaterId: string;
    bus: EventBus;
    configuration: Configuration;
  }) {
    this.repeaterId = repeaterId;
    this.bus = bus;
    this.configuration = configuration;

    const { container } = this.configuration;
    if (container.isRegistered(Logger, true)) {
      this.logger = container.resolve(Logger);
    }

    this.setupShutdown();
  }

  public async start(): Promise<void> {
    if (this.runningStatus !== RunningStatus.OFF) {
      throw new Error('Repeater is already active.');
    }

    this._runningStatus = RunningStatus.STARTING;

    try {
      await this.register();
      await this.subscribeToEvents();
      await this.schedulePing();

      this._runningStatus = RunningStatus.RUNNING;
    } catch (e) {
      this._runningStatus = RunningStatus.OFF;
      throw e;
    }
  }

  public async stop(): Promise<void> {
    if (this.runningStatus !== RunningStatus.RUNNING) {
      return;
    }

    this._runningStatus = RunningStatus.OFF;

    if (this.timer) {
      clearInterval(this.timer);
    }

    await this.sendStatus('disconnected');
    await this.bus.destroy?.();
  }

  private async register(): Promise<void> {
    const res = await this.bus.execute(
      new RegisterRepeaterCommand({
        version: this.configuration.repeaterVersion,
        repeaterId: this.repeaterId
      })
    );

    if (!res) {
      throw new Error('Error registering repeater.');
    }

    this.handleRegisterResult(res);
  }

  private async subscribeToEvents(): Promise<void> {
    await Promise.all(
      [
        ExecuteRequestEventHandler
        // TODO repeater scripts
      ].map(type => this.bus.register(type))
    );
  }

  private async schedulePing(): Promise<void> {
    await this.sendStatus('connected');
    this.timer = setInterval(() => this.sendStatus('connected'), 10000);
    this.timer.unref();
  }

  private async sendStatus(status: RepeaterStatus): Promise<void> {
    await this.bus.publish(
      new RepeaterStatusEvent({
        status,
        repeaterId: this.repeaterId
      })
    );
  }

  private setupShutdown(): void {
    ['SIGTERM', 'SIGINT', 'SIGHUP'].forEach(event => {
      process.on(event, async () => {
        try {
          await this.stop();
        } catch (e) {
          this.logger?.error(e.message);
        }
      });
    });
  }

  private handleRegisterResult(res: { payload: RegisterRepeaterResult }): void {
    const { payload } = res;

    if ('error' in payload) {
      this.handleRegisterError(payload.error);
    } else {
      if (gt(payload.version, this.configuration.repeaterVersion)) {
        this.logger?.warn(
          '%s: A new Repeater version (%s) is available, please update @sec-tester.',
          chalk.yellow('(!) IMPORTANT'),
          payload.version
        );
      }
    }
  }

  private handleRegisterError(error: RepeaterRegisteringError): never {
    switch (error) {
      case RepeaterRegisteringError.NOT_ACTIVE:
        throw new Error(`Access Refused: The current Repeater is not active.`);
      case RepeaterRegisteringError.NOT_FOUND:
        throw new Error(`Unauthorized access. Please check your credentials.`);
      case RepeaterRegisteringError.BUSY:
        throw new Error(
          `Access Refused: There is an already running Repeater with ID ${this.repeaterId}`
        );
      case RepeaterRegisteringError.REQUIRES_TO_BE_UPDATED:
        throw new Error(
          `${chalk.red(
            '(!) CRITICAL'
          )}: The current running version is no longer supported, please update @sec-tester.`
        );
    }
  }
}
