import { Issue, ScanConfig, ScanState } from './models';

export interface Scans {
  createScan(config: ScanConfig): Promise<{ id: string }>;

  listIssues(id: string): Promise<Issue[]>;

  stopScan(id: string): Promise<void>;

  deleteScan(id: string): Promise<void>;

  getScan(id: string): Promise<ScanState>;
}

export const Scans: unique symbol = Symbol('Scans');
