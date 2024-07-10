import {
  Tree,
  formatFiles,
  readProjectConfiguration,
  updateProjectConfiguration,
  parseTargetString
} from '@nx/devkit';

export interface PublishOptions {
  project: string;
  skipFormat: boolean;
  buildTarget: string;
}

export default async (tree: Tree, options: PublishOptions) => {
  const projectConfig = readProjectConfiguration(tree, options.project);

  const buildTarget = parseTargetString(options.buildTarget);
  const { options: targetOptions }: { options?: { outputPath: string } } =
    projectConfig.targets?.[buildTarget.target] ?? {};

  if (!targetOptions?.outputPath) {
    throw new Error(
      'Cannot find a build target or `outputPath` is not defined.'
    );
  }

  (projectConfig.targets ??= {})['publish'] = {
    executor: './tools/executors:publish',
    options: {
      dist: targetOptions.outputPath
    }
  };

  updateProjectConfiguration(tree, options.project, projectConfig);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
};
