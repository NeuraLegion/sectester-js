export interface BodyConverter<T> {
  canHandle(data: unknown, mimeType?: string): data is T;
  convert(data: T, mimeType?: string): Promise<string>;
  getMimeType(data: T): string;
}
