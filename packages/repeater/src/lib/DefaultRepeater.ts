import { Repeater, RunningStatus } from './Repeater';
import { RepeaterBridgesOptions } from './RepeaterBridgesOptions';
import {
  RepeaterServer,
  RepeaterErrorCodes,
  RepeaterServerErrorEvent,
  RepeaterServerEvents,
  RepeaterServerReconnectionAttemptedEvent,
  RepeaterServerReconnectionFailedEvent,
  RepeaterServerRequestEvent,
  RepeaterUpgradeAvailableEvent
} from './RepeaterServer';
import { RepeaterCommands } from './RepeaterCommands';
import { Request } from '../request-runner/Request';
import { Logger } from '@sectester/core';
import chalk from 'chalk';
import { inject, injectable, Lifecycle, scoped } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
@injectable()
export class DefaultRepeater implements Repeater {
  private _repeaterId = '';

  private _runningStatus = RunningStatus.OFF;

  get repeaterId(): string {
    return this._repeaterId;
  }

  get runningStatus(): RunningStatus {
    return this._runningStatus;
  }

  constructor(
    @inject(RepeaterBridgesOptions)
    private readonly repeaterBridgesOptions: RepeaterBridgesOptions,
    private readonly logger: Logger,
    @inject(RepeaterServer)
    private readonly repeaterServer: RepeaterServer,
    @inject(RepeaterCommands)
    private readonly repeaterCommands: RepeaterCommands
  ) {}

  public async start(): Promise<void> {
    if (this.runningStatus !== RunningStatus.OFF) {
      throw new Error('Repeater is already active.');
    }

    this._runningStatus = RunningStatus.STARTING;

    try {
      await this.connect();

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

    this.repeaterServer.disconnect();

    return Promise.resolve();
  }

  private async connect(): Promise<void> {
    this.logger.log('Connecting the Bridges');

    this.subscribeDiagnosticEvents();

    await this.repeaterServer.connect(this.repeaterBridgesOptions.domain);

    this.logger.log('Deploying the repeater');

    await this.deploy();

    this.logger.log('The Repeater (%s) started', this.repeaterId);

    this.subscribeRedeploymentEvent();
  }

  private async deploy() {
    const { repeaterId } = await this.repeaterServer.deploy();

    this._repeaterId = repeaterId;
  }

  private subscribeRedeploymentEvent() {
    this.repeaterServer.on(RepeaterServerEvents.CONNECTED, this.deploy);
  }

  private subscribeDiagnosticEvents() {
    this.repeaterServer.on(RepeaterServerEvents.ERROR, this.handleError);

    this.repeaterServer.on(
      RepeaterServerEvents.RECONNECTION_FAILED,
      this.reconnectionFailed
    );
    this.repeaterServer.on(RepeaterServerEvents.REQUEST, this.requestReceived);
    this.repeaterServer.on(
      RepeaterServerEvents.UPDATE_AVAILABLE,
      this.upgradeAvailable
    );
    this.repeaterServer.on(
      RepeaterServerEvents.RECONNECT_ATTEMPT,
      this.reconnectAttempt
    );
    this.repeaterServer.on(RepeaterServerEvents.RECONNECTION_SUCCEEDED, () =>
      this.logger.log('The Repeater (%s) connected', this.repeaterId)
    );
  }

  private handleError = ({
    code,
    message,
    remediation
  }: RepeaterServerErrorEvent) => {
    const normalizedMessage = this.normalizeMessage(message);
    const normalizedRemediation = this.normalizeMessage(remediation ?? '');

    if (this.isCriticalError(code)) {
      this.handleCriticalError(normalizedMessage, normalizedRemediation);
    } else {
      this.logger.error(normalizedMessage);
    }
  };

  private normalizeMessage(message: string): string {
    return message.replace(/\.$/, '');
  }

  private isCriticalError(code: RepeaterErrorCodes): boolean {
    return [
      RepeaterErrorCodes.REPEATER_DEACTIVATED,
      RepeaterErrorCodes.REPEATER_NO_LONGER_SUPPORTED,
      RepeaterErrorCodes.REPEATER_UNAUTHORIZED,
      RepeaterErrorCodes.REPEATER_ALREADY_STARTED,
      RepeaterErrorCodes.REPEATER_NOT_PERMITTED,
      RepeaterErrorCodes.UNEXPECTED_ERROR
    ].includes(code);
  }

  private handleCriticalError(message: string, remediation: string): void {
    this.logger.error(
      '%s: %s. %s',
      chalk.red('(!) CRITICAL'),
      message,
      remediation
    );
    this.stop().catch(this.logger.error);
  }

  private upgradeAvailable = (event: RepeaterUpgradeAvailableEvent) => {
    this.logger.warn(
      '%s: A new Repeater version (%s) is available, for update instruction visit https://docs.brightsec.com/docs/installation-options',
      chalk.yellow('(!) IMPORTANT'),
      event.version
    );
  };

  private reconnectAttempt = ({
    attempt,
    maxAttempts
  }: RepeaterServerReconnectionAttemptedEvent) => {
    this.logger.warn(
      'Failed to connect to Bright cloud (attempt %d/%d)',
      attempt,
      maxAttempts
    );
  };

  private reconnectionFailed = ({
    error
  }: RepeaterServerReconnectionFailedEvent) => {
    this.logger.error(error.message);
    this.stop().catch(this.logger.error);
  };

  private requestReceived = async (event: RepeaterServerRequestEvent) => {
    const response = await this.repeaterCommands.sendRequest(
      new Request({ ...event })
    );

    const {
      statusCode,
      message,
      errorCode,
      body,
      headers,
      protocol,
      encoding
    } = response;

    return {
      protocol,
      body,
      headers,
      statusCode,
      errorCode,
      message,
      encoding
    };
  };
}
