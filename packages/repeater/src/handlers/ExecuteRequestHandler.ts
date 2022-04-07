import { Request, RequestExecutor, Response } from '../request-executor';
import { ExecuteRequestEvent, ForwardResponseEvent } from './events';
import { bind, EventHandler } from '@secbox/core';
import { injectable, injectAll } from 'tsyringe';

@injectable()
@bind(ExecuteRequestEvent)
export class ExecuteRequestHandler
  implements EventHandler<ExecuteRequestEvent, ForwardResponseEvent>
{
  constructor(
    @injectAll(RequestExecutor)
    private readonly requestExecutors: RequestExecutor[]
  ) {}

  public async handle(
    event: ExecuteRequestEvent
  ): Promise<ForwardResponseEvent> {
    const { protocol } = event.payload;

    const requestExecutor = this.requestExecutors.find(
      x => x.protocol === protocol
    );

    if (!requestExecutor) {
      throw new Error(`Unsupported protocol "${protocol}"`);
    }

    const response: Response = await requestExecutor.execute(
      new Request({ ...event.payload })
    );

    const { statusCode, message, errorCode, body, headers } = response;

    return new ForwardResponseEvent({
      protocol,
      body,
      headers,
      statusCode,
      errorCode,
      message
    });
  }
}
