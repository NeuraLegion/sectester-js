import { Request } from './Request';
import { Response } from './Response';
import { Protocol } from './Protocol';

export interface RequestExecutor {
  protocol: Protocol;
  execute(request: Request): Promise<Response>;
}

export const RequestExecutor: unique symbol = Symbol('RequestExecutor');
