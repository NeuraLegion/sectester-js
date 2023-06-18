import { RequestRunner, RequestRunnerOptions } from '../request-runner';

export interface RepeaterRequestRunnerOptions {
  requestRunnerOptions?: RequestRunnerOptions;
  requestRunners?: (RequestRunner | { new (...args: any[]): RequestRunner })[];
}
