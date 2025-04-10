import { Reporter } from '../../lib';
import { GITHUB_CLIENT, GITHUB_CONFIG } from './api';
import type { GitHubClient } from './api';
import { SingleItemPayloadBuilder, MultiItemsPayloadBuilder } from './builders';
import type { CheckRunPayloadBuilder } from './builders';
import type { GitHubConfig } from './types';
import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';
import path from 'node:path';

// TODO add `GitHubCheckRunReporter` description to README
@injectable()
export class GitHubCheckRunReporter implements Reporter {
  constructor(
    @inject(GITHUB_CONFIG) private readonly config: GitHubConfig,
    @inject(GITHUB_CLIENT) private readonly githubClient: GitHubClient
  ) {
    if (!this.config.token) {
      throw new Error('GitHub token is not set');
    }

    if (!this.config.repository) {
      throw new Error('GitHub repository is not set');
    }

    if (!this.config.commitSha) {
      throw new Error('GitHub commitSha is not set');
    }
  }

  public async report(scan: Scan): Promise<void> {
    const issues = await scan.issues();
    if (issues.length === 0) return;

    const checkRunPayload = this.createCheckRunPayloadBuilder(issues).build();
    await this.githubClient.createCheckRun(checkRunPayload);
  }

  private createCheckRunPayloadBuilder(
    issues: Issue[]
  ): CheckRunPayloadBuilder {
    return issues.length === 1
      ? new SingleItemPayloadBuilder(
          issues[0],
          this.config.commitSha,
          this.getTestFilePath()
        )
      : new MultiItemsPayloadBuilder(
          issues,
          this.config.commitSha,
          this.getTestFilePath()
        );
  }

  // TODO subject to improvement
  private getTestFilePath(): string {
    // Check if running in Jest environment
    const jestState = (global as any).expect?.getState();
    if (jestState) {
      const testPath = jestState.testPath;
      const rootDir = jestState.snapshotState._rootDir;

      return path.join(
        path.basename(rootDir),
        path.relative(rootDir, testPath)
      );
    }

    // Relies on `TestContext` from Node.js built-in test runner appearing in the stack
    const matchRes = String(new Error().stack).match(
      /\n\s+at (?:async )?TestContext.* \((.*):\d+:\d+\)\n/
    );

    return matchRes?.[1]
      ? path.relative(process.cwd(), matchRes[1] || '')
      : 'unknown';
  }
}
