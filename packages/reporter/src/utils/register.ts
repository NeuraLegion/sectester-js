import { TEST_FILE_PATH_RESOLVER } from './TestFilePathResolver';
import { JestTestFilePathResolver } from './JestTestFilePathResolver';
import { container } from 'tsyringe';

container.registerSingleton(TEST_FILE_PATH_RESOLVER, JestTestFilePathResolver);
