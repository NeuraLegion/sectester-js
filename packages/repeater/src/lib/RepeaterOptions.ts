import { RepeaterRequestRunnerOptions } from './RepeaterRequestRunnerOptions';

export interface RepeaterOptions extends RepeaterRequestRunnerOptions {
  namePrefix?: string;
  projectId?: string;
  description?: string;
  disableRandomNameGeneration?: boolean;
}
