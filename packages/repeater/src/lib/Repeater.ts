export enum RunningStatus {
  OFF,
  STARTING,
  RUNNING
}

export type RepeaterId = string;
export const RepeaterId = Symbol('RepeaterId');

export interface Repeater {
  readonly repeaterId: RepeaterId;
  readonly runningStatus: RunningStatus;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const Repeater: unique symbol = Symbol('Repeater');
