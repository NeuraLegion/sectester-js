import { Request, Response } from '../request-runner';

export interface RepeaterCommands {
  sendRequest(request: Request): Promise<Response>;
}

export const RepeaterCommands: unique symbol = Symbol('RepeaterCommands');
