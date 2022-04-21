import { Severity } from './Severity';

export interface Issue {
  id: string;
  scanId: string;
  order: number;
  solved: boolean;
  details: string;
  name: string;
  severity: Severity;
  protocol: string;
  remedy: string;
  exposure: string;
  cvss: string;
  cwe: string;
  time: Date;
  screenshots: unknown[];
  originalRequest: Record<string, unknown>;
  request: Record<string, unknown>;
  frames: unknown[];
  originalFrames: [];
  response: Record<string, unknown>;
  assignees: unknown[];
  resources: string[];
  comments: string[];
}
