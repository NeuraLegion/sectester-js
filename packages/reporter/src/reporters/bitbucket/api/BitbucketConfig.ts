export interface BitbucketConfig {
  token?: string;
  workspace: string;
  repo: string;
  commitSha: string;
  /**
   * Whether to use the Bitbucket Pipelines proxy for authentication.
   * When running in Bitbucket Pipelines, requests can be sent through
   * a proxy at localhost:29418 which automatically adds authentication.
   */
  usePipelinesProxy?: boolean;
  /**
   * The proxy URL to use for Bitbucket Pipelines authentication.
   *
   * @default http://localhost:29418
   */
  proxyUrl?: string;
}

export const BITBUCKET_CONFIG = Symbol('BITBUCKET_CONFIG');
