import { TEST_FILE_PATH_RESOLVER } from './test-file-path-resolver';
import { JestTestFilePathResolver } from './jest-test-file-path-resolver';
import { container } from 'tsyringe';

container.registerSingleton(TEST_FILE_PATH_RESOLVER, JestTestFilePathResolver);
