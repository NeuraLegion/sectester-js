import { HttpRequest } from '@secbox/bus';

export class StopScan extends HttpRequest<undefined, void> {
  constructor(id: string) {
    super({
      url: `/api/v1/scans/${id}/stop`,
      payload: undefined
    });
  }
}
