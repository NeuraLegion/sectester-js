import { Issue } from '../Scans';
import { HttpOptions, HttpRequest } from '@secbox/bus';

export class ListIssues extends HttpRequest<void, Issue[]> {
  constructor(id: string) {
    const options: HttpOptions<void> = {
      url: `/api/v1/scans/${id}/issues`,
      payload: undefined
    };

    super(options);
  }
}
