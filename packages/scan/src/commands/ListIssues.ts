import { Issue } from '../Scans';
import { HttpRequest } from '@secbox/bus';

export class ListIssues extends HttpRequest<undefined, Issue[]> {
  constructor(id: string) {
    super({
      url: `/api/v1/scans/${id}/issues`,
      payload: undefined
    });
  }
}
