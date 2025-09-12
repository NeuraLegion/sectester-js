import { buildJUnitXML } from './build-junit-xml';
import {
  minimalTestReport,
  testReportWithSystemOut,
  testReportWithSpecialCharacters,
  testReportWithoutFailures,
  multipleTestSuitesReport
} from '../../../__fixtures__/junit-reports';

describe('buildJUnitXML', () => {
  it('should generate valid JUnit XML with minimal test suite', () => {
    const xml = buildJUnitXML(minimalTestReport);

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
    const xml = buildJUnitXML(testReportWithSystemOut);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Bright Tests" tests="1" failures="1">
    <testcase classname="GET https://example.com/api/search" name="XSS" file="test.spec.ts" time="0">
      <failure>XSS vulnerability found at GET https://example.com/api/search</failure>
      <system-out>{&quot;id&quot;: &quot;issue-1&quot;, &quot;name&quot;: &quot;XSS&quot;}</system-out>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should escape XML special characters', () => {
    const xml = buildJUnitXML(testReportWithSpecialCharacters);

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
    const xml = buildJUnitXML(testReportWithoutFailures);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Bright Tests" tests="1" failures="0">
    <testcase classname="GET https://example.com/api/search" name="XSS" file="test.spec.ts" time="0.5"/>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });

  it('should handle multiple test suites', () => {
    const xml = buildJUnitXML(multipleTestSuitesReport);

    const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Critical Bright Tests" tests="1" failures="1">
    <testcase classname="POST https://example.com/api/users" name="SQLi" file="test.spec.ts" time="0">
      <failure>SQLi vulnerability found at POST https://example.com/api/users</failure>
    </testcase>
  </testsuite>
  <testsuite name="High Bright Tests" tests="1" failures="1">
    <testcase classname="PUT https://example.com/api/profile" name="XSS" file="test.spec.ts" time="0">
      <failure>XSS vulnerability found at PUT https://example.com/api/profile</failure>
    </testcase>
  </testsuite>
</testsuites>`;

    expect(xml.trim()).toBe(expectedXml.trim());
  });
});
