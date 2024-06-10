import { RepeaterBus } from './RepeaterBus';
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

export class DefaultRepeaterBus implements RepeaterBus {
  private repeaterRunning: boolean = false;
  private _repeaterId?: string;

  get repeaterId(): string | undefined {
    return this._repeaterId;
  }

  constructor(
    private readonly logger: Logger,
    private readonly repeaterServer: RepeaterServer,
    private readonly commandHub: RepeaterCommands
  ) {}

  public close() {
    this.repeaterRunning = false;

    this.repeaterServer.disconnect();

    return Promise.resolve();
  }

  public async connect(): Promise<void> {
    if (this.repeaterRunning) {
      return;
    }

    this.repeaterRunning = true;

    this.logger.log('Connecting the Bridges');

    this.subscribeDiagnosticEvents();

    await this.repeaterServer.connect();

    this.logger.log('Deploying the repeater');

    await this.deploy();

    this.logger.log('The Repeater (%s) started', this.repeaterId);

    this.subscribeRedeploymentEvent();
  }

  private async deploy() {
    const { repeaterId } = await this.repeaterServer.deploy({
      repeaterId: this.repeaterId
    });

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
    this.close().catch(this.logger.error);
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
    this.close().catch(this.logger.error);
  };

  private requestReceived = async (event: RepeaterServerRequestEvent) => {
    const response = await this.commandHub.sendRequest(
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
