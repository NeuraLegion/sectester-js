import { RepeaterCommands } from './RepeaterCommands';
import { Request, Response, RequestRunner } from '../request-runner';
import { injectable, injectAll } from 'tsyringe';

@injectable()
export class DefaultRepeaterCommands implements RepeaterCommands {
  constructor(
    @injectAll(RequestRunner)
    private readonly requestRunners: RequestRunner[]
  ) {}

  public async sendRequest(request: Request): Promise<Response> {
    const { protocol } = request;

    const requestRunner = this.requestRunners.find(
      x => x.protocol === protocol
    );

    if (!requestRunner) {
      throw new Error(`Unsupported protocol "${protocol}"`);
    }

    return requestRunner.run(request);
  }
}
