import {
  DeployCommandOptions,
  RepeaterEventHub,
  RepeaterServerDeployedEvent
} from './RepeaterEventHub';

export interface RepeaterServer {
  events: RepeaterEventHub;

  disconnect(): void;

  connect(hostname: string): Promise<void>;

  deploy(options: DeployCommandOptions): Promise<RepeaterServerDeployedEvent>;
}

export const RepeaterServer: unique symbol = Symbol('RepeaterServer');
