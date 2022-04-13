import {
  AttackParamLocation,
  IssueCategory,
  ScanStatus,
  TestType
} from './enums';

export interface Scans {
  create(setings: ScanSettings): Promise<any>;
  listIssues(options: any): Promise<Issue[]>;
  stopScan(id: string): Promise<void>;
  getScan(id: string): Promise<ScanState>;
}

export const Scans: unique symbol = Symbol('Scans');

export interface Issue {
  id: string;
  createdAt: Date;
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
  query?: URLSearchParams | Record<string, unknown>;
  // The data to be sent as the request body.
  // The only required for POST, PUT, PATCH, and DELETE
  body?: FormData | URLSearchParams | string | unknown;
  // The request method to be used when making the request, GET by default
  method?: string;
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
