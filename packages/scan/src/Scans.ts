import { Issue, ScanConfig, ScanState } from './models';
import { Har } from '@har-sdk/core';

export interface UploadHarOptions {
  har: Har;
  filename: string;
  discard?: boolean;
}

export interface Scans {
  createScan(config: ScanConfig): Promise<{ id: string }>;

  listIssues(id: string): Promise<Issue[]>;

  stopScan(id: string): Promise<void>;

  getScan(id: string): Promise<ScanState>;

  uploadHar(options: UploadHarOptions): Promise<{ id: string }>;
}

export const Scans: unique symbol = Symbol('Scans');
