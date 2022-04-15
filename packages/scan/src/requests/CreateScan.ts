import { ScanConfig } from '../Scans';
import { HttpOptions, HttpRequest } from '@secbox/bus';

export class CreateScan extends HttpRequest<ScanConfig, { id: string }> {
  constructor(payload: ScanConfig) {
    const options: HttpOptions<ScanConfig> = {
      payload,
      url: '/api/v1/scans',
      method: 'POST'
    };
    super(options);
  }
}
