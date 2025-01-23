import type { CheckRunPayload } from '../types';

export interface GitHubClient {
  createCheckRun(payload: CheckRunPayload): Promise<void>;
}

export const GITHUB_CLIENT = Symbol('GITHUB_CLIENT');
