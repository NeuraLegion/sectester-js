import 'reflect-metadata';
import { GITHUB_CLIENT } from './GitHubClient';
import { GITHUB_CONFIG } from './GitHubConfig';
import { GitHubApiClient } from './GitHubApiClient';
import { container } from 'tsyringe';

let commitSha: string | undefined;

if (process.env.GITHUB_EVENT_PATH) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const eventData = require(process.env.GITHUB_EVENT_PATH);

  if (process.env.GITHUB_EVENT_NAME === 'check_suite') {
    ({ head_sha: commitSha } = eventData.check_suite ?? {});
  } else if (process.env.GITHUB_EVENT_NAME === 'check_run') {
    ({ head_sha: commitSha } = eventData.check_run?.check_suite ?? {});
  } else if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    commitSha = eventData.pull_request.head.sha;
  } else if (process.env.GITHUB_EVENT_NAME === 'push') {
    commitSha = eventData.after;
  } else {
    throw new Error(
      'No pull-request and commit data available for the request.'
    );
  }
}

container.register(GITHUB_CONFIG, {
  useValue: {
    commitSha,
    token: process.env.GITHUB_TOKEN,
    repository: process.env.GITHUB_REPOSITORY
  }
});
container.register(GITHUB_CLIENT, { useClass: GitHubApiClient });
