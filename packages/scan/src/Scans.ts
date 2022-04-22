import { UploadFileOptions } from './commands';
import FormData from 'form-data';

export enum AttackParamLocation {
  ARTIFICAL_FRAGMENT = 'artifical-fragment',
  ARTIFICAL_QUERY = 'artifical-query',
  BODY = 'body',
  FRAGMENT = 'fragment',
  HEADER = 'header',
  PATH = 'path',
  QUERY = 'query'
}

export enum Discovery {
  CRAWLER = 'crawler',
  ARCHIVE = 'archive',
  OAS = 'oas'
}

export enum IntegrationType {
  SLACK = 'slack',
  GITHUB = 'github',
  GITLAB = 'gitlab',
  JIRA = 'jira',
  TRELLO = 'trello',
  AZURE = 'azure',
  MONDAY = 'monday',
  SERVICENOW = 'sevicenow'
}

export enum IssueCategory {
  MEDIUM = 'Medium',
  HIGH = 'High',
  LOW = 'Low'
}

export enum Module {
  DAST = 'dast',
  FUZZER = 'fuzzer'
}

export enum ScanStatus {
  FAILED = 'failed',
  DISRUPTED = 'disrupted',
  RUNNING = 'running',
  STOPPED = 'stopped',
  QUEUED = 'queued',
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  DONE = 'done',
  PAUSED = 'paused'
}

export enum TestType {
  ANGULAR_CSTI = 'angular_csti',
  BACKUP_LOCATIONS = 'backup_locations',
  BROKEN_SAML_AUTH = 'broken_saml_auth',
  BRUTE_FORCE_LOGIN = 'brute_force_login',
  BUSINESS_CONSTRAINT_BYPASS = 'business_constraint_bypass',
  COMMON_FILES = 'common_files',
  COOKIE_SECURITY = 'cookie_security',
  CSRF = 'csrf',
  DATE_MANIPULATION = 'date_manipulation',
  DEFAULT_LOGIN_LOCATION = 'default_login_location',
  DIRECTORY_LISTING = 'directory_listing',
  DOM_XSS = 'dom_xss',
  EMAIL_INJECTION = 'email_injection',
  EXPOSED_COUCH_DB_APIS = 'exposed_couch_db_apis',
  FILE_UPLOAD = 'file_upload',
  FULL_PATH_DISCLOSURE = 'full_path_disclosure',
  HEADER_SECURITY = 'header_security',
  HRS = 'hrs',
  HTML_INJECTION = 'html_injection',
  HTTP_METHOD_FUZZING = 'http_method_fuzzing',
  HTTP_RESPONSE_SPLITTING = 'http_response_splitting',
  ID_ENUMERATION = 'id_enumeration',
  IMPROPER_ASSET_MANAGEMENT = 'improper_asset_management',
  INSECURE_TLS_CONFIGURATION = 'insecure_tls_configuration',
  JWT = 'jwt',
  LDAPI = 'ldapi',
  LFI = 'lfi',
  MASS_ASSIGNMENT = 'mass_assignment',
  NOSQL = 'nosql',
  OPEN_BUCKETS = 'open_buckets',
  OPEN_DATABASE = 'open_database',
  OSI = 'osi',
  PROTO_POLLUTION = 'proto_pollution',
  RETIRE_JS = 'retire_js',
  RFI = 'rfi',
  SECRET_TOKENS = 'secret_tokens',
  SERVER_SIDE_JS_INJECTION = 'server_side_js_injection',
  SQLI = 'sqli',
  SSRF = 'ssrf',
  SSTI = 'ssti',
  UNVALIDATED_REDIRECT = 'unvalidated_redirect',
  VERSION_CONTROL_SYSTEMS = 'version_control_systems',
  WORDPRESS = 'wordpress',
  XPATHI = 'xpathi',
  XSS = 'xss',
  XXE = 'xxe'
}

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
  crawlerUrls?: string[];
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
