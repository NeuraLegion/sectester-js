import { RequestExecutorOptions } from '../request-executor';

export interface RepeaterOptions {
  // repeater params
  name: string;
  description?: string;

  // feature flags
  certificates?: boolean;
  networkDiagnostic?: boolean;
  remoteScripts?: boolean;

  // request executor settings
  executor?: RequestExecutorOptions;
}
