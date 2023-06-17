import { RequestRunner, RequestRunnerOptions } from '../request-runner';

export interface RepeaterOptions {
  namePrefix?: string;
  projectId?: string;
  description?: string;
  requestRunnerOptions?: RequestRunnerOptions;
  requestRunners?: (RequestRunner | { new (...args: any[]): RequestRunner })[];
}
