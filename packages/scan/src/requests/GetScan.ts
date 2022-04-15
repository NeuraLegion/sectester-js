import { ScanState } from '../Scans';
import { HttpOptions, HttpRequest } from '@secbox/bus';

export class GetScan extends HttpRequest<void, ScanState> {
  constructor(id: string) {
    const options: HttpOptions<void> = {
      url: `/api/v1/scans/${id}`,
      payload: undefined
    };

    super(options);
  }
}
