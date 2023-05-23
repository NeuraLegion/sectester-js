import { RequestRunner, RequestRunnerOptions } from '../request-runner';

export interface RepeaterOptions {
  namePrefix?: string;
  description?: string;
  requestRunnerOptions?: RequestRunnerOptions;
  requestRunners?: (RequestRunner | { new (...args: any[]): RequestRunner })[];
}
