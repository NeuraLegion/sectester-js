import { ScanConfig } from '../models';
import { HttpRequest } from '@sec-tester/bus';

export class CreateScan extends HttpRequest<ScanConfig, { id: string }> {
  constructor(payload: ScanConfig) {
    super({
      payload,
      url: '/api/v1/scans',
      method: 'POST'
    });
  }
}
