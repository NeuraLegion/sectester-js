import { BodyConverter } from './BodyConverter';
import { escape } from '../../utils';
import { normalizeLinefeeds } from '../../utils/normalize-linefeeds';
import { getRandomValues } from 'node:crypto';

export class FormDataConverter implements BodyConverter<FormData> {
  public canHandle(data: unknown): data is FormData {
    return data instanceof FormData;
  }

  public async convert(data: FormData): Promise<string> {
    const array = new Uint32Array(10);
    const boundary = escape(`----BrightFormBoundary${getRandomValues(array)}`);
    let formDataString = '';

    for (const [key, value] of data) {
      formDataString += `--${boundary}\r\n`;
      if (typeof value === 'string') {
        formDataString += `content-disposition: form-data; name="${escape(normalizeLinefeeds(key))}"\r\n\r\n`;
        formDataString += `${value}\r\n`;
      } else {
        formDataString += `content-disposition: form-data; name="${escape(normalizeLinefeeds(key))}"; filename="${escape(value.type)}"\r\n`;
        formDataString += `content-type: ${value.type || 'application/octet-stream'}\r\n\r\n`;
        formDataString += `${await this.convertBlob(value)}\r\n`;
      }
    }

    formDataString += `--${boundary}--\r\n`;

    return formDataString;
  }

  public getMimeType(_data: FormData): string {
    return 'multipart/form-data';
  }

  private async convertBlob(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();

    return new TextDecoder().decode(arrayBuffer);
  }
}
