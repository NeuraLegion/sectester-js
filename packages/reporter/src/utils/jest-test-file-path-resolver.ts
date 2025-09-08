import { TestFilePathResolver } from './test-file-path-resolver';
import { injectable } from 'tsyringe';
import { join, basename, relative } from 'node:path';

@injectable()
export class JestTestFilePathResolver implements TestFilePathResolver {
  public getTestFilePath(): string {
    // Check if running in Jest environment
    const jestState = (global as any).expect?.getState?.();
    if (jestState) {
      const testPath = jestState.testPath;
      const rootDir = jestState.snapshotState._rootDir;

      return join(
        basename(rootDir),
        relative(rootDir, testPath)
      );
    }

    // Relies on `TestContext` from Node.js built-in test runner appearing in the stack
    const matchRes = String(new Error().stack).match(
      /\n\s+at (?:async )?TestContext.* \((.*):\d+:\d+\)\n/
    );

    return matchRes?.[1]
      ? relative(process.cwd(), matchRes[1] || '')
      : 'unknown';
  }
}
