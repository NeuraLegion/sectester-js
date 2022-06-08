import { Scans, UploadHarOptions } from './Scans';
import {
  CreateScan,
  DeleteScan,
  GetScan,
  ListIssues,
  StopScan,
  UploadHar
} from './commands';
import { Issue, ScanConfig, ScanState } from './models';
import { inject, injectable } from 'tsyringe';
import { Command, CommandDispatcher, Configuration } from '@sectester/core';
import ci from 'ci-info';

@injectable()
export class DefaultScans implements Scans {
  constructor(
    private readonly configuration: Configuration,
    @inject(CommandDispatcher)
    private readonly commandDispatcher: CommandDispatcher
  ) {}

  public createScan(config: ScanConfig): Promise<{ id: string }> {
    return this.sendCommand(
      new CreateScan({
        ...config,
        info: {
          source: 'utlib',
          provider: ci.name,
          client: {
            name: this.configuration.name,
            version: this.configuration.version
          }
        }
      })
    );
  }

  public async listIssues(id: string): Promise<Issue[]> {
    const issues = await this.sendCommand(new ListIssues(id));

    return issues.map(x => ({
      ...x,
      link: `${this.configuration.api}/scans/${id}/issues/${x.id}`
    }));
  }

  public async stopScan(id: string): Promise<void> {
    await this.commandDispatcher.execute(new StopScan(id));
  }

  public async deleteScan(id: string): Promise<void> {
    await this.commandDispatcher.execute(new DeleteScan(id));
  }

  public getScan(id: string): Promise<ScanState> {
    return this.sendCommand(new GetScan(id));
  }

  public uploadHar(options: UploadHarOptions): Promise<{ id: string }> {
    return this.sendCommand(new UploadHar(options));
  }

  private async sendCommand<T, R>(command: Command<T, R>): Promise<R> {
    const result = await this.commandDispatcher.execute(command);

    this.assertReply(result);

    return result;
  }

  private assertReply<T>(
    result: T | undefined
  ): asserts result is NonNullable<T> {
    if (!result) {
      throw new Error('Something went wrong. Please try again later.');
    }
  }
}
