import type { CheckRunPayload } from '../types';
import { BasePayloadBuilder } from './BasePayloadBuilder';
import type { Comment, Issue } from '@sectester/scan';

export class SingleItemPayloadBuilder extends BasePayloadBuilder {
  constructor(
    private readonly issue: Issue,
    commitSha: string | undefined,
    testFilePath: string
  ) {
    super(commitSha, testFilePath);
  }

  public build(): CheckRunPayload {
    return {
      name: `SecTester - ${this.buildEndpoint()}`,
      head_sha: this.commitSha,
      conclusion: 'failure',
      output: {
        title: this.buildTitle(),
        summary: this.buildSummary(),
        text: this.buildDetails(),
        annotations: [this.convertIssueToAnnotation(this.issue)]
      }
    };
  }

  private buildEndpoint(): string {
    return `${this.issue.originalRequest.method} ${new URL(this.issue.originalRequest.url).pathname}`;
  }

  private buildTitle(): string {
    return `${this.issue.name} found at ${this.buildEndpoint()}`;
  }

  private buildSummary(): string {
    return [
      `Name: ${this.issue.name}`,
      `Severity: ${this.issue.severity}`,
      `Bright UI link: ${this.issue.link}`,
      `\nRemediation:\n${this.issue.remedy}`
    ].join('\n');
  }

  private buildDetails(): string {
    const extraDetails = this.issue.comments?.length
      ? this.formatList(
          this.issue.comments.map(x => this.formatIssueComment(x))
        )
      : '';

    const references = this.issue.resources?.length
      ? this.formatList(this.issue.resources)
      : '';

    return [
      `${this.issue.details}`,
      ...(extraDetails ? [`\nExtra Details:\n${extraDetails}`] : []),
      ...(references ? [`\nReferences:\n${references}`] : [])
    ].join('\n');
  }

  private formatList(items: string[]): string {
    return items.map(x => `- ${x}`).join('\n');
  }

  private formatIssueComment({ headline, text = '', links = [] }: Comment) {
    const body = [
      text,
      ...(links.length ? [`Links:\n${this.formatList(links)}`] : [])
    ].join('\n');

    const indentedBody = body
      .split('\n')
      .map(x => `\t${x}`)
      .join('\n');

    return [headline, indentedBody].join('\n');
  }
}
