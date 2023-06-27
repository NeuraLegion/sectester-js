import { Protocol } from '../models';
import { Request, RequestRunner, Response } from '../request-runner';
import { bind, EventHandler } from '@sectester/core';
import { injectAll, Lifecycle, scoped } from 'tsyringe';

export interface ExecuteRequestPayload {
  readonly protocol: Protocol;
  readonly url: string;
  readonly headers: Record<string, string | string[]>;
  readonly method?: string;
  readonly body?: string;
  readonly correlation_id_regex?: string;
}

export interface ExecuteRequestResult {
  readonly protocol: Protocol;
  readonly body?: string;
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly status_code?: number;
  readonly error_code?: string;
  readonly message?: string;
}

@scoped(Lifecycle.ContainerScoped)
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

    const response: Response = await runner.run(
      new Request({ ...event, correlationIdRegex: event.correlation_id_regex })
    );

    const { statusCode, message, errorCode, body, headers } = response;

    return {
      protocol,
      body,
      headers,
      message,
      status_code: statusCode,
      error_code: errorCode
    };
  }
}
