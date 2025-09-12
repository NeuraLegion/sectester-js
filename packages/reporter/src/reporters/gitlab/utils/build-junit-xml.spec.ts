import { buildJUnitXML } from './build-junit-xml';
import type { TestReport } from '../types';

describe('buildJUnitXML', () => {
  it('should generate valid JUnit XML with minimal test suite', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Bright Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'POST https://example.com/api/users',
              name: 'SQLi',
              file: 'test.spec.ts',
              time: 0,
              failure:
                'SQLi vulnerability found at POST https://example.com/api/users'
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Bright Tests" tests="1" failures="1">
    <testcase classname="POST https://example.com/api/users" name="SQLi" file="test.spec.ts" time="0">
      <failure>SQLi vulnerability found at POST https://example.com/api/users</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle test cases with system-out', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Bright Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              systemOut: '{"id": "issue-1", "name": "XSS"}',
              classname: 'GET https://example.com/api/search',
              name: 'XSS',
              file: 'test.spec.ts',
              time: 0,
              failure:
                'Cross-site scripting vulnerability found at GET https://example.com/api/search'
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Bright Tests" tests="1" failures="1">
    <testcase classname="GET https://example.com/api/search" name="XSS" file="test.spec.ts" time="0">
      <failure>Cross-site scripting vulnerability found at GET https://example.com/api/search</failure>
      <system-out>{&quot;id&quot;: &quot;issue-1&quot;, &quot;name&quot;: &quot;XSS&quot;}</system-out>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should escape XML special characters', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Bright Tests & More',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'GET https://example.com/api/search',
              name: 'XSS',
              file: 'test.spec.ts',
              time: 0,
              failure:
                'XSS vulnerability found at GET https://example.com/api/search?q=Bar & Co'
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Bright Tests &amp; More" tests="1" failures="1">
    <testcase classname="GET https://example.com/api/search" name="XSS" file="test.spec.ts" time="0">
      <failure>XSS vulnerability found at GET https://example.com/api/search?q=Bar &amp; Co</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle test cases without nested elements', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Bright Tests',
          tests: 1,
          failures: 0,
          testCases: [
            {
              classname: 'GET https://example.com/api/search',
              name: 'XSS',
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
  <testsuite name="Bright Tests" tests="1" failures="0">
    <testcase classname="GET https://example.com/api/search" name="XSS" file="test.spec.ts" time="0.5"/>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle multiple test suites', () => {
    const report: TestReport = {
      testSuites: [
        {
          name: 'Critical Bright Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'POST https://example.com/api/users',
              name: 'SQLi',
              file: 'test.spec.ts',
              time: 0,
              failure:
                'SQLi vulnerability found at POST https://example.com/api/users'
            }
          ]
        },
        {
          name: 'High Bright Tests',
          tests: 1,
          failures: 1,
          testCases: [
            {
              classname: 'PUT https://example.com/api/profile',
              name: 'XSS',
              file: 'test.spec.ts',
              time: 0,
              failure:
                'Cross-site scripting vulnerability found at PUT https://example.com/api/profile'
            }
          ]
        }
      ]
    };

    const xml = buildJUnitXML(report);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Critical Bright Tests" tests="1" failures="1">
    <testcase classname="POST https://example.com/api/users" name="SQLi" file="test.spec.ts" time="0">
      <failure>SQLi vulnerability found at POST https://example.com/api/users</failure>
    </testcase>
  </testsuite>
  <testsuite name="High Bright Tests" tests="1" failures="1">
    <testcase classname="PUT https://example.com/api/profile" name="XSS" file="test.spec.ts" time="0">
      <failure>Cross-site scripting vulnerability found at PUT https://example.com/api/profile</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });
});
