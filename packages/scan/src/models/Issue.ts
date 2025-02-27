import { Severity } from './Severity';
import { HttpMethod } from './HttpMethod';

export type Protocol = 'http' | 'ws';

export interface Request {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  protocol?: Protocol;
}

export interface Response {
  headers?: Record<string, string>;
  body?: string;
  status?: number;
  protocol?: Protocol;
}

export interface Screenshot {
  url: string;
  title: string;
}

export interface Comment {
  headline: string;
  links?: string[];
  text?: string;
}

export interface Issue {
  id: string;
  details: string;
  name: string;
  certainty: boolean;
  severity: Severity;
  protocol: Protocol;
  remedy: string;
  time: Date;
  originalRequest: Request;
  request: Request;
  link: string;
  exposure?: string;
  resources?: string[];
  comments?: Comment[];
  screenshots?: Screenshot[];
  cvss?: string;
  cwe?: string;
}
