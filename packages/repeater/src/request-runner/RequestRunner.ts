import { Request } from './Request';
import { Response } from './Response';
import { Protocol } from '../models';

export interface RequestRunner {
  protocol: Protocol;
  run(request: Request): Promise<Response>;
}

export const RequestRunner: unique symbol = Symbol('RequestRunner');
