import { Issue, ScanConfig, Scans, ScanState } from './Scans';
import {
  CreateScan,
  GetScan,
  ListIssues,
  StopScan,
  UploadFileOptions,
  UploadHar
} from './commands';
import { HttpCommandDispatcher } from '@secbox/bus';
import { inject, injectable } from 'tsyringe';
import { CommandDispatcher } from '@secbox/core';

@injectable()
export class DefaultScans implements Scans {
  constructor(
    @inject(CommandDispatcher)
    private readonly commandDispatcher: HttpCommandDispatcher
  ) {}

  public async create(config: ScanConfig): Promise<{ id: string }> {
    const result = await this.commandDispatcher.execute(new CreateScan(config));

    if (!result) {
      throw new Error(`Failed to create scan ${config.name}`);
    }

    return result;
  }

  public async listIssues(id: string): Promise<Issue[]> {
    const result = await this.commandDispatcher.execute(new ListIssues(id));

    if (!result) {
      throw new Error(`Failed to get issue list for scan with id ${id}`);
    }

    return result;
  }

  public stopScan(id: string): Promise<void> {
    return this.commandDispatcher.execute(new StopScan(id));
  }

  public async getScan(id: string): Promise<ScanState> {
    const result = await this.commandDispatcher.execute(new GetScan(id));

    if (!result) {
      throw new Error(`Failed to get status of scan with id ${id}`);
    }

    return result;
  }

  public async uploadHar(
    options: UploadFileOptions,
    discard: boolean = true
  ): Promise<{ id: string }> {
    const result = await this.commandDispatcher.execute(
      new UploadHar(options, { discard })
    );

    if (!result) {
      throw new Error(`Failet to uplad Har file ${options.filename}.`);
    }

    return result;
  }
}
