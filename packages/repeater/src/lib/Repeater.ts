export enum RunningStatus {
  OFF,
  STARTING,
  RUNNING
}

export interface Repeater {
  readonly repeaterId: string;
  readonly runningStatus: RunningStatus;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const Repeater: unique symbol = Symbol('Repeater');
