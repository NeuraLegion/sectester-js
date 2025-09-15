import type {
  TestReport,
  JUnitTestSuite,
  JUnitTestCase
} from '../reporters/gitlab/types';

export const createVulnerabilityTestCase = (
  method: string,
  endpoint: string,
  vulnerability: string,
  time: number = 0
): JUnitTestCase => ({
  time,
  classname: `${method} ${endpoint}`,
  name: vulnerability,
  file: 'test.spec.ts',
  failure: `${vulnerability} vulnerability found at ${method} ${endpoint}`
});

export const createTestCaseWithSystemOut = (
  baseTestCase: JUnitTestCase,
  systemOut: string
): JUnitTestCase => ({
  ...baseTestCase,
  systemOut
});

export const createTestCaseWithSpecialChars = (
  failure: string
): JUnitTestCase => ({
  failure,
  classname: 'GET https://example.com/api/search',
  name: 'XSS',
  file: 'test.spec.ts',
  time: 0
});

export const createPassingTestCase = (
  classname: string,
  name: string,
  time: number = 0.5
): JUnitTestCase => ({
  classname,
  name,
  time,
  file: 'test.spec.ts'
});

export const createTestSuite = (
  name: string,
  testCases: JUnitTestCase[],
  failures?: number
): JUnitTestSuite => ({
  name,
  testCases,
  tests: testCases.length,
  failures: failures ?? testCases.filter(tc => tc.failure).length
});

export const brightTestSuite = createTestSuite('Bright Tests', [
  createVulnerabilityTestCase('POST', 'https://example.com/api/users', 'SQLi')
]);
export const criticalBrightTestSuite = createTestSuite(
  'Critical Bright Tests',
  [createVulnerabilityTestCase('POST', 'https://example.com/api/users', 'SQLi')]
);
export const highBrightTestSuite = createTestSuite('High Bright Tests', [
  createVulnerabilityTestCase('PUT', 'https://example.com/api/profile', 'XSS')
]);

export const minimalTestReport: TestReport = {
  testSuites: [brightTestSuite]
};

export const testReportWithSystemOut: TestReport = {
  testSuites: [
    createTestSuite('Bright Tests', [
      createTestCaseWithSystemOut(
        createVulnerabilityTestCase(
          'GET',
          'https://example.com/api/search',
          'XSS'
        ),
        '{"id": "issue-1", "name": "XSS"}'
      )
    ])
  ]
};

export const testReportWithSpecialCharacters: TestReport = {
  testSuites: [
    createTestSuite('Bright Tests & More', [
      createTestCaseWithSpecialChars(
        'XSS vulnerability found at GET https://example.com/api/search?q=Bar & Co'
      )
    ])
  ]
};

export const testReportWithoutFailures: TestReport = {
  testSuites: [
    createTestSuite(
      'Bright Tests',
      [createPassingTestCase('GET https://example.com/api/search', 'XSS')],
      0
    )
  ]
};

export const multipleTestSuitesReport: TestReport = {
  testSuites: [criticalBrightTestSuite, highBrightTestSuite]
};
