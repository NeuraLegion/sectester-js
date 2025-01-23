export interface GitHubConfig {
  token?: string;
  repository?: string;
  commitSha?: string;
}

export const GITHUB_CONFIG = Symbol('GITHUB_CONFIG');
