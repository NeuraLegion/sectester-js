import { GITHUB_CLIENT } from './GitHubClient';
import { GITHUB_CONFIG } from './GitHubConfig';
import { GitHubApiClient } from './GitHubApiClient';
import { container } from 'tsyringe';

container.register(GITHUB_CONFIG, {
  useValue: {
    token: process.env.GITHUB_TOKEN,
    repository: process.env.GITHUB_REPOSITORY,
    commitSha: process.env.PR_COMMIT_SHA
  }
});
container.register(GITHUB_CLIENT, { useClass: GitHubApiClient });
