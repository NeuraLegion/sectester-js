import { RepeaterBus } from '../bus';

export enum RunningStatus {
  OFF,
  STARTING,
  RUNNING
}

export class Repeater {
  private _runningStatus = RunningStatus.OFF;

  get repeaterId(): string | undefined {
    return this.bus.repeaterId;
  }

  get runningStatus(): RunningStatus {
    return this._runningStatus;
  }

  constructor(private readonly bus: RepeaterBus) {}

  public async start(): Promise<void> {
    if (this.runningStatus !== RunningStatus.OFF) {
      throw new Error('Repeater is already active.');
    }

    this._runningStatus = RunningStatus.STARTING;

    try {
      await this.bus.connect();

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

    await this.bus.close();
  }
}
