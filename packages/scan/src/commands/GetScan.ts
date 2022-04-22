import { ScanState } from '../Scans';
import { HttpRequest } from '@secbox/bus';

export class GetScan extends HttpRequest<undefined, ScanState> {
  constructor(id: string) {
    super({
      url: `/api/v1/scans/${id}`,
      payload: undefined
    });
  }
}
