import { BodyConverter } from './BodyConverter';

export class ConverterRegistry {
  private readonly converters: BodyConverter<unknown>[] = [];

  constructor(converters: BodyConverter<unknown>[]) {
    this.converters = converters;
  }

  public getConverter(
    data: unknown,
    mimeType?: string
  ): BodyConverter<unknown> | undefined {
    return this.converters.find(converter =>
      converter.canHandle(data, mimeType)
    );
  }
}
