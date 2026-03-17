import 'reflect-metadata';
import { BITBUCKET_CLIENT } from './BitbucketClient';
import { BITBUCKET_CONFIG } from './BitbucketConfig';
import { BitbucketApiClient } from './BitbucketApiClient';
import { container } from 'tsyringe';

let commitSha: string | undefined;

if (process.env.BITBUCKET_COMMIT) {
  commitSha = process.env.BITBUCKET_COMMIT;
} else if (process.env.BITBUCKET_PR_DESTINATION_COMMIT) {
  commitSha = process.env.BITBUCKET_PR_DESTINATION_COMMIT;
}

// Detect if running in Bitbucket Pipelines
const usePipelinesProxy = typeof process.env.BITBUCKET_BRANCH === 'string';

const workspace =
  process.env.BITBUCKET_WORKSPACE ?? process.env.BITBUCKET_REPO_OWNER;

container.register(BITBUCKET_CONFIG, {
  useValue: {
    commitSha,
    workspace,
    usePipelinesProxy,
    repo: process.env.BITBUCKET_REPO_SLUG
  }
});
container.register(BITBUCKET_CLIENT, { useClass: BitbucketApiClient });
