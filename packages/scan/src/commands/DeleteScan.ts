import { HttpRequest } from '@sectester/bus';

export class DeleteScan extends HttpRequest {
  constructor(id: string) {
    super({
      method: 'DELETE',
      url: `/api/v1/scans/${id}`,
      payload: undefined,
      expectReply: false
    });
  }
}
