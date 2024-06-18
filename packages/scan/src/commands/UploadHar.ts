import { UploadHarOptions } from '../Scans';
import FormData from 'form-data';
import { HttpRequest } from '@sectester/core';

export class UploadHar extends HttpRequest<FormData, { id: string }> {
  constructor({ filename, har, discard = false }: UploadHarOptions) {
    const payload = new FormData();
    payload.append('file', JSON.stringify(har), {
      filename,
      contentType: 'application/json'
    });

    super({
      payload,
      method: 'POST',
      url: '/api/v1/files',
      params: { discard }
    });
  }
}
