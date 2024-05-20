import { Request, Response } from '../request-runner';

export interface RepeaterCommandHub {
  sendRequest(request: Request): Promise<Response>;
}

export const RepeaterCommandHub: unique symbol = Symbol('RepeaterCommandHub');
