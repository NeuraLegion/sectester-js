import { ScanConfig } from '../models';
import { HttpRequest } from '@sectester/bus';

export type CreateScanPayload = ScanConfig & {
  info: {
    source: 'utlib';
    client: { name: string; version: string };
    provider: string | null;
  };
};

export class CreateScan extends HttpRequest<CreateScanPayload, { id: string }> {
  constructor(payload: CreateScanPayload) {
    super({
      payload,
      url: '/api/v1/scans',
      method: 'POST'
    });
  }
}
