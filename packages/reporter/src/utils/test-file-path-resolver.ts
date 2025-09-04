export interface TestFilePathResolver {
  getTestFilePath(): string;
}

export const TEST_FILE_PATH_RESOLVER = Symbol('TEST_FILE_PATH_RESOLVER');
