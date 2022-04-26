import { Issue, ScanConfig, Scans, ScanState } from './Scans';
import {
  CreateScan,
  GetScan,
  ListIssues,
  StopScan,
  UploadHar,
  UploadHarPayload
} from './commands';
import { inject, injectable } from 'tsyringe';
import { CommandDispatcher } from '@secbox/core';

@injectable()
export class DefaultScans implements Scans {
  constructor(
    @inject(CommandDispatcher)
    private readonly commandDispatcher: CommandDispatcher
  ) {}

  public async create(config: ScanConfig): Promise<{ id: string }> {
    return (
      (await this.commandDispatcher.execute(new CreateScan(config))) ??
      ({} as { id: string })
    );
  }

  public async listIssues(id: string): Promise<Issue[]> {
    return (await this.commandDispatcher.execute(new ListIssues(id))) ?? [];
  }

  public stopScan(id: string): Promise<void> {
    return this.commandDispatcher.execute(new StopScan(id));
  }

  public async getScan(id: string): Promise<ScanState> {
    return (
      (await this.commandDispatcher.execute(new GetScan(id))) ??
      ({} as ScanState)
    );
  }

  public async uploadHar(options: UploadHarPayload): Promise<{ id: string }> {
    return (
      (await this.commandDispatcher.execute(new UploadHar(options))) ??
      ({} as { id: string })
    );
  }
}
