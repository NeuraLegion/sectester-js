import { RequestRunnerOptions } from '../request-runner';

export interface RepeaterOptions {
  name: string;
  description?: string;

  // TODO clarify usages
  requestRunner?: RequestRunnerOptions;
}
