import { CheckRunPayloadBuilder } from './CheckRunPayloadBuilder';
import { CheckRunAnnotation, CheckRunPayload } from '../types';
import type { Issue } from '@sectester/scan';

export abstract class BasePayloadBuilder implements CheckRunPayloadBuilder {
  protected readonly commitSha: string;

  constructor(
    commitSha: string | undefined,
    protected readonly testFilePath: string
  ) {
    if (!commitSha) {
      throw new Error('Commit SHA is required');
    }
    this.commitSha = commitSha;
  }

  public abstract build(): CheckRunPayload;

  protected convertIssueToAnnotation(issue: Issue): CheckRunAnnotation {
    const { originalRequest, name } = issue;
    const title = `${name} vulnerability found at ${originalRequest.method.toUpperCase()} ${originalRequest.url}`;

    return {
      path: this.testFilePath,
      start_line: 1,
      end_line: 1,
      annotation_level: 'failure',
      message: title,
      raw_details: JSON.stringify(issue, null, 2)
    };
  }
}
