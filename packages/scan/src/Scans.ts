import { Issue, ScanConfig, ScanState } from './models';
import { Target } from './target';

export interface Scans {
  createScan(config: ScanConfig): Promise<{ id: string }>;

  listIssues(id: string): Promise<Issue[]>;

  stopScan(id: string): Promise<void>;

  deleteScan(id: string): Promise<void>;

  getScan(id: string): Promise<ScanState>;

  createEntrypoint(
    target: Target,
    repeaterId?: string
  ): Promise<{ id: string }>;
}

export const Scans: unique symbol = Symbol('Scans');
