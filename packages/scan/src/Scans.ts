import {
  AttackParamLocation,
  Discovery,
  IntegrationType,
  IssueCategory,
  Module,
  ScanStatus,
  TestType
} from './enums';
import { UploadFileOptions } from './requests';

export interface Issue {
  id: string;
  scanId: string;
  order: number;
  solved: boolean;
  details: string;
  name: string;
  severity: string;
  protocol: string;
  remedy: string;
  exposure: string;
  cvss: string;
  cwe: string;
  time: Date;
  screenshots: unknown[];
  originalRequest: Record<string, unknown>;
  request: Record<string, unknown>;
  frames: unknown[];
  originalFrames: [];
  response: Record<string, unknown>;
  assignees: unknown[];
  resources: string[];
  comments: string[];
}

export interface CountIssuesBySeverity {
  number: number;
  type: IssueCategory;
}

export interface ScanState {
  status: ScanStatus;
  issuesBySeverity: CountIssuesBySeverity[];
}

export interface Target {
  // The server URL that will be used for the request
  url: string;
  // The query parameters to be sent with the request
  query?: URLSearchParams | Record<string, string>;
  // The data to be sent as the request body.
  // The only required for POST, PUT, PATCH, and DELETE
  body?: FormData | URLSearchParams | string | unknown;
  // The request method to be used when making the request, GET by default
  method?: string;
  // The headers
  headers?: Record<string, string>;
  // The optional method of serializing `query`
  // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
  serializeQuery?(params: URLSearchParams | Record<string, unknown>): string;
}

export interface ScanSettings {
  // The Scan name
  name: string;
  // The list of tests to be performed against the target application
  tests: TestType[];
  // The target that will be attacked
  target: Target;
  // Determine whether scan is smart or simple
  smart?: boolean;
  // Pool size
  poolSize?: number;
  // Allows to skip testing static parameters.
  skipStaticParams?: boolean;
  // Defines which part of the request to attack
  attackParamLocations?: AttackParamLocation[];
}

export interface Header {
  name: string;
  value: string;
  mergeStrategy?: 'replace';
}

export interface Repository {
  id: string;
  service: IntegrationType;
  name: string;
  uri?: string;
}

export interface ScanConfig {
  name: string;
  module: Module;
  tests: TestType[];
  authObjectId?: string;
  projectId?: string;
  discoveryTypes?: Discovery[];
  poolSize?: number;
  fileId?: string;
  attackParamLocations?: AttackParamLocation[];
  smart?: boolean;
  extraHosts?: Record<string, string>;
  headers?: Record<string, string> | Header[];
  crawlerUrls?: string;
  hostsFilter?: string[];
  repeaters?: string[];
  boards?: Map<IntegrationType, string[]>;
  repositories?: Repository[];
  skipStaticParams?: boolean;
}

export interface Scans {
  create(setings: ScanConfig): Promise<{ id: string }>;
  listIssues(id: string): Promise<Issue[]>;
  stopScan(id: string): Promise<void>;
  getScan(id: string): Promise<ScanState>;
  uploadHar(
    options: UploadFileOptions,
    discard?: boolean
  ): Promise<{ id: string }>;
}

export const Scans: unique symbol = Symbol('Scans');
