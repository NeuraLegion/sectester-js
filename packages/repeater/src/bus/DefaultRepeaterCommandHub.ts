import { RepeaterCommandHub } from './RepeaterCommandHub';
import { Request, Response, RequestRunner } from '../request-runner';
import { injectable, injectAll } from 'tsyringe';

@injectable()
export class DefaultRepeaterCommandHub implements RepeaterCommandHub {
  constructor(
    @injectAll(RequestRunner)
    private readonly requestRunners: RequestRunner[]
  ) {}

  public sendRequest(request: Request): Promise<Response> {
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
