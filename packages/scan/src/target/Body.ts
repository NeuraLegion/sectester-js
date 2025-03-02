import {
  ArrayBufferConverter,
  AsyncIterableConverter,
  BlobConverter,
  ConverterRegistry,
  FormDataConverter,
  IterableConverter,
  JsonConverter,
  StreamConverter,
  StringConverter,
  URLSearchParamsConverter
} from './converters';

export type BodyType =
  | ArrayBuffer
  | AsyncIterable<Uint8Array>
  | Blob
  | FormData
  | NodeJS.ReadableStream
  | Iterable<Uint8Array>
  | NodeJS.ArrayBufferView
  | URLSearchParams
  | unknown
  | null;

export class Body {
  private static readonly converterRegistry = new ConverterRegistry([
    new ArrayBufferConverter(),
    new FormDataConverter(),
    new URLSearchParamsConverter(),
    new BlobConverter(),
    new StreamConverter(),
    new JsonConverter(),
    new StringConverter(),
    new IterableConverter(),
    new AsyncIterableConverter()
  ]);

  constructor(
    private readonly data: BodyType,
    private readonly mimeType?: string
  ) {}

  public async text(): Promise<string | undefined> {
    if (this.data === null) {
      return 'null';
    }

    const converter = Body.converterRegistry.getConverter(
      this.data,
      this.mimeType
    );

    if (converter) {
      return converter.convert(this.data, this.mimeType);
    }

    // Fallback to string conversion for any other types
    return String(this.data);
  }

  public type(): string {
    if (this.mimeType) {
      return this.mimeType;
    }

    if (this.data === null) {
      return 'text/plain';
    }

    const converter = Body.converterRegistry.getConverter(this.data);

    if (converter) {
      return converter.getMimeType(this.data);
    }

    // Default type for unknown data
    return '';
  }
}
