import { RequestRunnerOptions } from '../request-runner';

export interface RepeaterOptions {
  // repeater params
  name: string;
  description?: string;

  // feature flags
  certificates?: boolean;
  networkDiagnostic?: boolean;
  remoteScripts?: boolean;

  // request executor settings
  executor?: RequestRunnerOptions;
}
