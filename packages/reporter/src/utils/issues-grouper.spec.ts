import { Issue, Severity } from '../models';
import { IssuesGrouper } from './issues-grouper';

const issues = [
  {
    name: 'SSTI - Server Side Template Injection',
    request: {
      url: 'https://qa.brokencrystals.com/api/render?'
    },
    severity: Severity.HIGH
  },
  {
    name: 'Reflective Cross-site scripting (rXSS)',
    request: {
      url: 'https://qa.brokencrystals.com/?artifical3160fc2b=%22%3Cdiv+OnCliCk%3Dalert%28576485%29%3E%3C%2Fdiv%3E'
    },
    severity: Severity.HIGH
  },
  {
    name: 'Directory Listing',
    request: {
      url: 'https://qa.brokencrystals.com/?'
    },
    severity: Severity.MEDIUM
  },
  {
    name: 'Reflective Cross-site scripting (rXSS)',
    request: {
      url: 'https://qa.brokencrystals.com/?artifical3160fc2b=%22%3Cdiv+OnCliCk%3Dalert%28576485%29%3E%3C%2Fdiv%3E'
    },
    severity: Severity.HIGH
  },
  {
    name: 'Misconfigured X-Content-Type-Options Header',
    request: {
      url: 'https://qa.brokencrystals.com'
    },
    severity: Severity.LOW
  }
] as Partial<Issue>[] as Issue[];

const groupedIssues = [
  {
    name: 'Reflective Cross-site scripting (rXSS)',
    severity: Severity.HIGH,
    issues: [
      {
        name: 'Reflective Cross-site scripting (rXSS)',
        request: {
          url: 'https://qa.brokencrystals.com/?artifical3160fc2b=%22%3Cdiv+OnCliCk%3Dalert%28576485%29%3E%3C%2Fdiv%3E'
        },
        severity: Severity.HIGH
      },
      {
        name: 'Reflective Cross-site scripting (rXSS)',
        request: {
          url: 'https://qa.brokencrystals.com/?artifical3160fc2b=%22%3Cdiv+OnCliCk%3Dalert%28576485%29%3E%3C%2Fdiv%3E'
        },
        severity: Severity.HIGH
      }
    ]
  },
  {
    name: 'SSTI - Server Side Template Injection',
    severity: Severity.HIGH,
    issues: [
      {
        name: 'SSTI - Server Side Template Injection',
        request: {
          url: 'https://qa.brokencrystals.com/api/render?'
        },
        severity: Severity.HIGH
      }
    ]
  },
  {
    name: 'Directory Listing',
    severity: Severity.MEDIUM,
    issues: [
      {
        name: 'Directory Listing',
        request: {
          url: 'https://qa.brokencrystals.com/?'
        },
        severity: Severity.MEDIUM
      }
    ]
  },
  {
    name: 'Misconfigured X-Content-Type-Options Header',
    severity: Severity.LOW,
    issues: [
      {
        name: 'Misconfigured X-Content-Type-Options Header',
        request: {
          url: 'https://qa.brokencrystals.com'
        },
        severity: Severity.LOW
      }
    ]
  }
];

describe('IssuesGrouper', () => {
  describe('group', () => {
    it('should group issues', () => {
      const res = IssuesGrouper.group(issues);

      expect(res).toEqual(groupedIssues);
    });
  });
});
