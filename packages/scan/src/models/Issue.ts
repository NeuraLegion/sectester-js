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

export type Frame = 'outgoing' | 'incoming';

export interface WebsocketFrame {
  type: Frame;
  status?: number;
  data?: string;
  timestamp?: number;
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
  order: number;
  details: string;
  name: string;
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
  frames?: WebsocketFrame[];
  originalFrames?: WebsocketFrame[];
  response?: Response;
}
