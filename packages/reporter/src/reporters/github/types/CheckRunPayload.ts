import type { Endpoints } from '@octokit/types';

export type CheckRunPayload =
  Endpoints['POST /repos/{owner}/{repo}/check-runs']['request']['data'];
