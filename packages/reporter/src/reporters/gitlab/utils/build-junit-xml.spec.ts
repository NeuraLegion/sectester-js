import { buildJUnitXML } from './build-junit-xml';
import type { TestReport } from '../types';

describe('buildJUnitXML', () => {
  it('should generate valid JUnit XML with minimal test suite', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Security Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'Critical Security Issues',
              name: 'SQL_Injection_abc123',
              file: 'test.spec.ts',
              time: 0,
              failure: {
                message: 'Security vulnerability detected: SQL Injection',
                content:
                  'SQL Injection vulnerability found at POST https://example.com/api/users'
              }
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Security Tests" tests="1" failures="1">
    <testcase classname="Critical Security Issues" name="SQL_Injection_abc123" file="test.spec.ts" time="0">
      <failure message="Security vulnerability detected: SQL Injection">SQL Injection vulnerability found at POST https://example.com/api/users</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle test cases with system-out', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Security Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'High Security Issues',
              name: 'XSS_test_def456',
              file: 'test.spec.ts',
              time: 0,
              failure: {
                message: 'XSS vulnerability detected',
                content: 'Cross-site scripting vulnerability found'
              },
              systemOut:
                'Request Method: GET\nRequest URL: https://example.com/api/search\nEntry Point ID: abc123\nIssue ID: issue-1'
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Security Tests" tests="1" failures="1">
    <testcase classname="High Security Issues" name="XSS_test_def456" file="test.spec.ts" time="0">
      <failure message="XSS vulnerability detected">Cross-site scripting vulnerability found</failure>
      <system-out>Request Method: GET
Request URL: https://example.com/api/search
Entry Point ID: abc123
Issue ID: issue-1</system-out>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should escape XML special characters', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Security Tests & More',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'High Security Issues <critical>',
              name: 'XSS_test_with_"quotes"',
              file: 'test.spec.ts',
              time: 0,
              failure: {
                message: 'XSS vulnerability with <script> tags',
                content: 'Found <script>alert("xss")</script> in response'
              }
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Security Tests &amp; More" tests="1" failures="1">
    <testcase classname="High Security Issues &lt;critical&gt;" name="XSS_test_with_&quot;quotes&quot;" file="test.spec.ts" time="0">
      <failure message="XSS vulnerability with &lt;script&gt; tags">Found &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; in response</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle test cases without nested elements', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Security Tests',
          tests: 1,
          failures: 0,
          testCases: [
            {
              classname: 'Security Issues',
              name: 'test_passed',
              file: 'test.spec.ts',
              time: 0.5
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Security Tests" tests="1" failures="0">
    <testcase classname="Security Issues" name="test_passed" file="test.spec.ts" time="0.5"/>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle multiple test suites', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Critical Security Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'Critical Security Issues',
              name: 'sql_injection_test',
              file: 'test.spec.ts',
              time: 0,
              failure: {
                message: 'SQL Injection found',
                content: 'Vulnerability detected'
              }
            }
          ]
        },
        {
          name: 'High Security Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'High Security Issues',
              name: 'xss_test',
              file: 'test.spec.ts',
              time: 0,
              failure: {
                message: 'XSS found',
                content: 'Cross-site scripting detected'
              }
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Critical Security Tests" tests="1" failures="1">
    <testcase classname="Critical Security Issues" name="sql_injection_test" file="test.spec.ts" time="0">
      <failure message="SQL Injection found">Vulnerability detected</failure>
    </testcase>
  </testsuite>
  <testsuite name="High Security Tests" tests="1" failures="1">
    <testcase classname="High Security Issues" name="xss_test" file="test.spec.ts" time="0">
      <failure message="XSS found">Cross-site scripting detected</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });
});
