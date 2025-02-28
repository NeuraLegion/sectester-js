import { HttpMethod, Issue, Severity } from '@sectester/scan';
import { randomUUID } from 'crypto';

export const issueWithoutResourcesText = `Issue in Bright UI:   http://app.neuralegion.com/scans/pDzxcEXQC8df1fcz1QwPf9/issues/pDzxcEXQC8df1fcz1QwPf9
Name:                 Database connection crashed
Severity:             Medium
Remediation:
The best way to protect against those kind of issues is making sure the Database resources are sufficient
Details:
Cross-site request forgery is a type of malicious website exploit.`;
export const issueWithoutResources = {
  id: randomUUID(),
  details: 'Cross-site request forgery is a type of malicious website exploit.',
  name: 'Database connection crashed',
  severity: Severity.MEDIUM,
  protocol: 'http',
  remedy:
    'The best way to protect against those kind of issues is making sure the Database resources are sufficient',
  cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L',
  time: new Date(),
  originalRequest: {
    method: HttpMethod.GET,
    url: 'https://brokencrystals.com/'
  },
  request: {
    method: HttpMethod.GET,
    url: 'https://brokencrystals.com/'
  },
  link: 'http://app.neuralegion.com/scans/pDzxcEXQC8df1fcz1QwPf9/issues/pDzxcEXQC8df1fcz1QwPf9',
  certainty: true
} satisfies Issue;

export const fullyDescribedIssueText = `${issueWithoutResourcesText}
Extra Details:
● Missing Strict-Transport-Security Header
\tThe engine detected a missing Strict-Transport-Security header, which might cause data to be sent insecurely from the client to the server.
\tLinks:
\t● https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts
References:
● https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts`;
export const fullyDescribedIssue = {
  ...issueWithoutResources,
  comments: [
    {
      headline: 'Missing Strict-Transport-Security Header',
      text: 'The engine detected a missing Strict-Transport-Security header, which might cause data to be sent insecurely from the client to the server.',
      links: [
        'https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts'
      ]
    }
  ],
  resources: [
    'https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts'
  ]
};
export const issueWithoutExtraInfoText = `${issueWithoutResourcesText}
References:
 ● https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts`;
export const issueWithoutExtraInfo = {
  ...issueWithoutResources,
  resources: [
    'https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts'
  ]
} satisfies Issue;
