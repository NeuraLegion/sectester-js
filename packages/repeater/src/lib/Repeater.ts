import { RepeaterBus } from '../bus';

export enum RunningStatus {
  OFF,
  STARTING,
  RUNNING
}

export type RepeaterId = string;
export const RepeaterId = Symbol('RepeaterId');

export class Repeater {
  public readonly repeaterId: RepeaterId;

  private readonly bus: RepeaterBus;

  private _runningStatus = RunningStatus.OFF;

  get runningStatus(): RunningStatus {
    return this._runningStatus;
  }

  constructor({
    repeaterId,
    bus
  }: {
    repeaterId: RepeaterId;
    bus: RepeaterBus;
  }) {
    this.repeaterId = repeaterId;
    this.bus = bus;
  }

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
