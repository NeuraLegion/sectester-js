import { Protocol } from '../models/Protocol';

export interface RepeaterServerDeployedEvent {
  repeaterId: string;
}

export interface RepeaterServerRequestEvent {
  protocol: Protocol;
  url: string;
  method?: string;
  headers?: Record<string, string | string[]>;
  correlationIdRegex?: string;
  body?: string;
  encoding?: 'base64';
  maxContentSize?: number;
  timeout?: number;
}

export type RepeaterServerRequestResponse =
  | {
      protocol: Protocol;
      statusCode?: number;
      message?: string;
      errorCode?: string;
      headers?: Record<string, string | string[] | undefined>;
      body?: string;
    }
  | {
      protocol: Protocol;
      message?: string;
      errorCode?: string;
    };

export interface RepeaterServerReconnectionFailedEvent {
  error: Error;
}

export interface RepeaterServerReconnectionAttemptedEvent {
  attempt: number;
  maxAttempts: number;
}

export enum RepeaterErrorCodes {
  REPEATER_NOT_PERMITTED = 'repeater_not_permitted',
  REPEATER_ALREADY_STARTED = 'repeater_already_started',
  REPEATER_DEACTIVATED = 'repeater_deactivated',
  REPEATER_UNAUTHORIZED = 'repeater_unauthorized',
  REPEATER_NO_LONGER_SUPPORTED = 'repeater_no_longer_supported',
  UNKNOWN_ERROR = 'unknown_error',
  UNEXPECTED_ERROR = 'unexpected_error'
}

export interface RepeaterServerErrorEvent {
  message: string;
  code: RepeaterErrorCodes;
  transaction?: string;
  remediation?: string;
}

export interface RepeaterUpgradeAvailableEvent {
  version: string;
}

export interface DeployCommandOptions {
  repeaterId?: string;
}

export const enum RepeaterServerEvents {
  DEPLOYED = 'deployed',
  DEPLOY = 'deploy',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  REQUEST = 'request',
  UPDATE_AVAILABLE = 'update_available',
  RECONNECTION_FAILED = 'reconnection_failed',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECTION_SUCCEEDED = 'reconnection_succeeded',
  ERROR = 'error',
  PING = 'ping'
}

export interface RepeaterServerEventsMap {
  [RepeaterServerEvents.DEPLOY]: [DeployCommandOptions];
  [RepeaterServerEvents.DEPLOYED]: RepeaterServerDeployedEvent;
  [RepeaterServerEvents.CONNECTED]: void;
  [RepeaterServerEvents.DISCONNECTED]: void;
  [RepeaterServerEvents.REQUEST]: RepeaterServerRequestEvent;
  [RepeaterServerEvents.UPDATE_AVAILABLE]: RepeaterUpgradeAvailableEvent;
  [RepeaterServerEvents.RECONNECTION_FAILED]: RepeaterServerReconnectionFailedEvent;
  [RepeaterServerEvents.RECONNECT_ATTEMPT]: RepeaterServerReconnectionAttemptedEvent;
  [RepeaterServerEvents.RECONNECTION_SUCCEEDED]: void;
  [RepeaterServerEvents.ERROR]: RepeaterServerErrorEvent;
  [RepeaterServerEvents.PING]: void;
}

export type RepeaterServerEventHandler<
  K extends keyof RepeaterServerEventsMap
> = (
  ...args: RepeaterServerEventsMap[K] extends (infer U)[]
    ? U[]
    : [RepeaterServerEventsMap[K]]
) => unknown;

export type CallbackFunction<T = unknown> = (arg: T) => unknown;
export type HandlerFunction = (args: unknown[]) => unknown;

export interface RepeaterServer {
  connect(domain: string): Promise<void>;

  disconnect(): void;

  deploy(options?: DeployCommandOptions): Promise<RepeaterServerDeployedEvent>;

  on<K extends keyof RepeaterServerEventsMap>(
    event: K,
    handler: RepeaterServerEventHandler<K>
  ): void;

  off<K extends keyof RepeaterServerEventsMap>(
    event: K,
    handler?: RepeaterServerEventHandler<K>
  ): void;
}

export const RepeaterServer: unique symbol = Symbol('RepeaterServer');
