export interface Reporter {
  report(scan: unknown): Promise<void>;
}
