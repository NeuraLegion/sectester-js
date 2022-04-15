import { HttpOptions, HttpRequest } from '@secbox/bus';

export class StopScan extends HttpRequest<void, void> {
  constructor(id: string) {
    const options: HttpOptions<void> = {
      url: `/api/v1/scans/${id}/stop`,
      payload: undefined
    };

    super(options);
  }
}
