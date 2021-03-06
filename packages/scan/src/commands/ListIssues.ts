import { Issue } from '../models';
import { HttpRequest } from '@sectester/bus';

export class ListIssues extends HttpRequest<undefined, Omit<Issue, 'link'>[]> {
  constructor(id: string) {
    super({
      url: `/api/v1/scans/${id}/issues`,
      payload: undefined
    });
  }
}
