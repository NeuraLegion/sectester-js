import { detectPackageManager, ExecutorContext, logger } from '@nx/devkit';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { access } from 'fs';

export interface PublishOptions {
  dist: string;
  dryRun?: boolean;
  tag?: string;
}

export default async (
  options: PublishOptions,
  context: ExecutorContext
): Promise<{ success: boolean; error?: string | null }> => {
  const { projectName } = context ?? { projectName: null };

  if (!projectName) {
    return failureOutput('Invalid project.');
  }

  if (!options.dist) {
    return failureOutput(
      `Run \`nx workspace-generator publish ${projectName}\` to init options.`
    );
  }

  const packageJson = join(options.dist, 'package.json');

  if (!(await checkFilePerms(packageJson))) {
    return failureOutput(`File ${packageJson} doesn't exist`);
  }

  const packageManager = detectPackageManager();

  if (packageManager === 'pnpm' || packageManager === 'bun') {
    return failureOutput(
      `${packageManager} package manager doesn't no supported`
    );
  }

  try {
    await execute(generatePublishCommand(packageManager, options), {
      projectName,
      cwd: context.root
    });

    logger.info(`The "${projectName}" project has published`);
  } catch (e) {
    return failureOutput('Error: ' + e.message);
  }

  return { success: true };
};

const execute = async (
  cmd: string,
  options: { projectName: string; cwd: string }
) => {
  const { stdout, stderr } = await promisify(exec)(cmd, options);

  if (stderr) {
    throw new Error(stderr);
  }

  logger.info(stdout);
};

const checkFilePerms = async (path: string): Promise<boolean> => {
  try {
    await promisify(access)(path);

    return true;
  } catch {
    return false;
  }
};

const generatePublishCommand = (
  packageManager: 'yarn' | 'npm',
  options: PublishOptions
) => {
  const cmd = `${packageManager} publish ${options.dist}`;
  const args = [
    ...(options.tag ? [`--tag ${options.tag}`] : []),
    ...(options.dryRun ? ['--dry-run'] : []),
    ...(packageManager === 'npm' ? ['--loglevel error'] : [])
  ];

  return `${cmd} ${args.join(' ')}`.trim();
};

const failureOutput = (
  error?: string
): { success: boolean; error: string | null } => {
  if (error) {
    logger.info(error);
  }

  return { success: false, error: error as unknown as string };
};
