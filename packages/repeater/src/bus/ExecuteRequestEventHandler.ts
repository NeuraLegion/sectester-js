import { Protocol } from '../models';
import { Request, RequestRunner, Response } from '../request-runner';
import { bind, EventHandler } from '@secbox/core';
import { injectable, injectAll } from 'tsyringe';

interface ExecuteRequestPayload {
  readonly protocol: Protocol;
  readonly url: string;
  readonly headers: Record<string, string | string[]>;
  readonly method?: string;
  readonly body?: string;
  readonly correlationIdRegex?: string;
}

interface ExecuteRequestResult {
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
  implements EventHandler<ExecuteRequestPayload, ExecuteRequestResult>
{
  constructor(
    @injectAll(RequestRunner)
    private readonly requestRunners: RequestRunner[]
  ) {}

  public async handle(
    event: ExecuteRequestPayload
  ): Promise<ExecuteRequestResult> {
    const { protocol } = event;

    const runner = this.requestRunners.find(x => x.protocol === protocol);

    if (!runner) {
      throw new Error(`Unsupported protocol "${protocol}"`);
    }

    const response: Response = await runner.run(new Request({ ...event }));

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
