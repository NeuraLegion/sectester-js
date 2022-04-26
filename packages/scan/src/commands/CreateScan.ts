import { ScanConfig } from '../models';
import { HttpRequest } from '@secbox/bus';

export class CreateScan extends HttpRequest<ScanConfig, { id: string }> {
  constructor(payload: ScanConfig) {
    super({
      payload,
      url: '/api/v1/scans',
      method: 'POST'
    });
  }
}
