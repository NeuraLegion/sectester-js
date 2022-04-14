import { RegisterRepeaterCommand, RegisterRepeaterResult } from '../commands';
import { ExecuteRequestHandler, RepeaterStatusEvent } from '../handlers';
import { RepeaterStatus } from './RepeaterStatus';
import { Configuration, EventBus } from '@secbox/core';
import Timer = NodeJS.Timer;

export class Repeater {
  public readonly repeaterId;
  private readonly bus: EventBus;
  private readonly configuration: Configuration;

  private timer?: Timer;

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
  }

  public async start(): Promise<void> {
    await this.register();

    await this.subscribeToEvents();

    await this.schedulePing();
  }

  public async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }

    await this.ping('disconnected');
    await this.bus.destroy?.();
  }

  private register(): Promise<RegisterRepeaterResult | undefined> {
    return new RegisterRepeaterCommand({
      version: this.configuration.version,
      repeaterId: this.repeaterId
    }).execute(this.bus);
  }

  private async subscribeToEvents(): Promise<void> {
    await Promise.all(
      [
        ExecuteRequestHandler
        // TODO repeater scripts
      ].map(type => this.bus.register(type))
    );
  }

  private async schedulePing(): Promise<void> {
    await this.ping('connected');
    this.timer = setInterval(() => this.ping('connected'), 10000);
    this.timer.unref();
  }

  private ping(status: RepeaterStatus): Promise<void> {
    return new RepeaterStatusEvent({
      repeaterId: this.repeaterId,
      status
    }).publish(this.bus);
  }
}
