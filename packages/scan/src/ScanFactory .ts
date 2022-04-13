import { Scans, ScanSettings } from './Scans';
import { Scan } from './Scan';
import { autoInjectable, inject } from 'tsyringe';

@autoInjectable()
export class ScanFactory {
  constructor(@inject(Scans) private readonly scans: Scans) {}

  public async createScan(settings: ScanSettings): Promise<Scan> {
    const { id } = await this.scans.create(settings);

    return new Scan(id, this.scans);
  }
}
