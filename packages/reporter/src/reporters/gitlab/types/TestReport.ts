export interface JUnitTestCase {
  classname: string;
  name: string;
  file?: string;
  time?: number;
  failure?: string;
  error?: string;
  skipped?: string;
  systemOut?: string;
  systemErr?: string;
}

export interface JUnitTestSuite {
  name: string;
  tests: number;
  failures?: number;
  errors?: number;
  skipped?: number;
  time?: number;
  testCases: JUnitTestCase[];
}

export interface JUnitTestSuites {
  testSuites: JUnitTestSuite[];
}

export type TestReport = JUnitTestSuites;
