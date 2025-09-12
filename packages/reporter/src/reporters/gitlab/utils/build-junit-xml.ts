import type { TestReport, JUnitTestSuite, JUnitTestCase } from '../types';
import { XMLBuilder } from 'fast-xml-parser';

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  indentBy: '  ',
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  suppressEmptyNode: true,
  suppressUnpairedNode: false
});

export function buildJUnitXML(report: TestReport): string {
  const xmlObject = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8'
    },
    'testsuites': {
      testsuite: report.testSuites.map(suite => buildTestSuiteObject(suite))
    }
  };

  return xmlBuilder.build(xmlObject);
}

function buildTestSuiteObject(testsuite: JUnitTestSuite) {
  const suiteObject: Record<string, unknown> = {
    '@_name': testsuite.name,
    '@_tests': testsuite.tests.toString()
  };

  if (testsuite.failures !== undefined) {
    suiteObject['@_failures'] = testsuite.failures.toString();
  }

  if (testsuite.errors !== undefined) {
    suiteObject['@_errors'] = testsuite.errors.toString();
  }

  if (testsuite.skipped !== undefined) {
    suiteObject['@_skipped'] = testsuite.skipped.toString();
  }

  if (testsuite.time !== undefined) {
    suiteObject['@_time'] = testsuite.time.toString();
  }

  if (testsuite.testCases.length > 0) {
    suiteObject.testcase = testsuite.testCases.map(testcase =>
      buildTestCaseObject(testcase)
    );
  }

  return suiteObject;
}

function addBasicTestCaseProperties(
  caseObject: Record<string, unknown>,
  testcase: JUnitTestCase
): void {
  if (testcase.file) {
    caseObject['@_file'] = testcase.file;
  }

  if (testcase.time !== undefined) {
    caseObject['@_time'] = testcase.time.toString();
  }
}

function addTestCaseResults(
  caseObject: Record<string, unknown>,
  testcase: JUnitTestCase
): void {
  if (testcase.failure) {
    caseObject.failure = {
      '#text': testcase.failure
    };
  }

  if (testcase.error) {
    caseObject.error = {
      '#text': testcase.error
    };
  }

  if (testcase.skipped) {
    caseObject.skipped = {
      '#text': testcase.skipped
    };
  }
}

function addTestCaseOutputs(
  caseObject: Record<string, unknown>,
  testcase: JUnitTestCase
): void {
  if (testcase.systemOut) {
    caseObject['system-out'] = { '#text': testcase.systemOut };
  }

  if (testcase.systemErr) {
    caseObject['system-err'] = { '#text': testcase.systemErr };
  }
}

function buildTestCaseObject(testcase: JUnitTestCase) {
  const caseObject: Record<string, unknown> = {
    '@_classname': testcase.classname,
    '@_name': testcase.name
  };

  addBasicTestCaseProperties(caseObject, testcase);
  addTestCaseResults(caseObject, testcase);
  addTestCaseOutputs(caseObject, testcase);

  return caseObject;
}
