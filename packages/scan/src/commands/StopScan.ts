import { HttpRequest } from '@sectester/bus';

export class StopScan extends HttpRequest {
  constructor(id: string) {
    super({
      url: `/api/v1/scans/${id}/stop`,
      payload: undefined,
      expectReply: false
    });
  }
}
