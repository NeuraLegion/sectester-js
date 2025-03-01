import { escape } from '../utils';
import { getRandomValues } from 'node:crypto';
import { isReadable } from 'node:stream';

export type BodyType =
  | ArrayBuffer
  | AsyncIterable<Uint8Array>
  | Blob
  | FormData
  | NodeJS.ReadableStream
  | Iterable<Uint8Array>
  | NodeJS.ArrayBufferView
  | URLSearchParams
  | null
  | string
  | Record<string, unknown>;

export class Body {
  constructor(private readonly data: BodyType) {}

  private static fromArrayBuffer(data: ArrayBuffer): string {
    return new TextDecoder().decode(data);
  }

  private static async fromAsyncIterable(
    data: AsyncIterable<Uint8Array>
  ): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  }

  private static async fromBlob(data: Blob): Promise<string> {
    const arrayBuffer = await data.arrayBuffer();

    return new TextDecoder().decode(arrayBuffer);
  }

  private static async fromFormData(data: FormData): Promise<string> {
    const array = new Uint32Array(10);

    const boundary = escape(`----BrightFormBoundary${getRandomValues(array)}`);

    let formDataString = '';

    for (const [key, value] of data) {
      formDataString += `--${boundary}\r\n`;
      if (typeof value === 'string') {
        formDataString += `content-disposition: form-data; name="${key}"\r\n\r\n`;
        formDataString += `${value}\r\n`;
      } else {
        formDataString += `content-disposition: form-data; name="${value.name}"; filename="${value.type}"\r\n`;
        formDataString += `content-type: ${value.type}\r\n\r\n`;
        formDataString += `${await this.fromBlob(value)}\r\n`;
      }
    }

    formDataString += `--${boundary}--\r\n`;

    return formDataString;
  }

  private static fromIterable(data: Iterable<Uint8Array>): string {
    const chunks: Uint8Array[] = [];
    for (const chunk of data) {
      chunks.push(chunk);
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  }

  private static fromArrayBufferView(data: NodeJS.ArrayBufferView): string {
    return new TextDecoder().decode(data);
  }

  private static fromURLSearchParams(data: URLSearchParams): string {
    return data.toString();
  }

  private static async fromReadableStream(
    data: NodeJS.ReadableStream
  ): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of data) {
      chunks.push(Buffer.from(chunk));
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  }

  // eslint-disable-next-line complexity
  public async text(): Promise<string | undefined> {
    if (!this.data) {
      return;
    }

    if (typeof this.data === 'string') {
      return this.data;
    }

    if (this.data instanceof ArrayBuffer) {
      return Body.fromArrayBuffer(this.data);
    }

    if (this.data instanceof Blob) {
      return Body.fromBlob(this.data);
    }

    if (this.data instanceof FormData) {
      return Body.fromFormData(this.data);
    }

    if (this.data instanceof URLSearchParams) {
      return Body.fromURLSearchParams(this.data);
    }

    if (ArrayBuffer.isView(this.data)) {
      return Body.fromArrayBufferView(this.data);
    }

    if (typeof Object(this.data)[Symbol.iterator] === 'function') {
      return Body.fromIterable(this.data as Iterable<Uint8Array>);
    }

    if (isReadable(this.data as NodeJS.ReadableStream)) {
      return Body.fromReadableStream(this.data as NodeJS.ReadableStream);
    }

    if (typeof Object(this.data)[Symbol.asyncIterator] === 'function') {
      return Body.fromAsyncIterable(this.data as AsyncIterable<Uint8Array>);
    }

    if (typeof this.data === 'object') {
      return JSON.stringify(this.data);
    }

    throw new Error('Unsupported data type');
  }

  public type(): string {
    if (this.data === null) {
      return 'text/plain';
    }

    if (typeof this.data === 'string') {
      return this.detectStringMimeType(this.data);
    }

    if (this.data instanceof FormData) {
      return 'multipart/form-data';
    }

    if (this.data instanceof URLSearchParams) {
      return 'application/x-www-form-urlencoded';
    }

    if (this.data instanceof Blob) {
      return this.data.type ?? 'application/octet-stream';
    }

    if (this.isPlainObject(this.data)) {
      return 'application/json';
    }

    return 'application/octet-stream';
  }

  private detectStringMimeType(data: string): string {
    const trimmed = data.trim();

    if (this.isJson(trimmed)) {
      return 'application/json';
    }

    if (this.isXml(trimmed)) {
      return 'application/xml';
    }

    return 'text/plain';
  }

  private isJson(text: string): boolean {
    if (
      !(
        (text.startsWith('{') && text.endsWith('}')) ||
        (text.startsWith('[') && text.endsWith(']'))
      )
    ) {
      return false;
    }

    try {
      JSON.parse(text);

      return true;
    } catch {
      return false;
    }
  }

  private isXml(text: string): boolean {
    return (
      text.startsWith('<?xml') ||
      (text.startsWith('<') &&
        !text.startsWith('<!DOCTYPE html') &&
        !text.startsWith('<!--') &&
        text.includes('</') &&
        text.endsWith('>'))
    );
  }

  private isPlainObject(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      !(data instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(data) &&
      !(Symbol.iterator in data) &&
      !(Symbol.asyncIterator in data) &&
      !isReadable(data as NodeJS.ReadableStream)
    );
  }
}
