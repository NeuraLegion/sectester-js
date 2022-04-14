import { ExecuteRequestEvent } from './ExecuteRequestEvent';
import { Protocol } from '../models';
import { Request, RequestRunner, Response } from '../request-runner';
import { bind, EventHandler } from '@secbox/core';
import { injectable, injectAll } from 'tsyringe';

export interface ExecuteRequestResult {
  readonly protocol: Protocol;
  readonly body?: string;
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly statusCode?: number;
  readonly errorCode?: string;
  readonly message?: string;
}

@injectable()
@bind('ExecuteScript')
export class ExecuteRequestEventHandler
  implements EventHandler<ExecuteRequestEvent, ExecuteRequestResult>
{
  constructor(
    @injectAll(RequestRunner)
    private readonly requestRunners: RequestRunner[]
  ) {}

  public async handle(
    event: ExecuteRequestEvent
  ): Promise<ExecuteRequestResult> {
    const { protocol } = event.payload;

    const runner = this.requestRunners.find(x => x.protocol === protocol);

    if (!runner) {
      throw new Error(`Unsupported protocol "${protocol}"`);
    }

    const response: Response = await runner.run(
      new Request({ ...event.payload })
    );

    const { statusCode, message, errorCode, body, headers } = response;

    return {
      protocol,
      body,
      headers,
      statusCode,
      errorCode,
      message
    };
  }
}
