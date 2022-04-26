import { Har } from '../HarEntryBuilder';
import FormData from 'form-data';
import { HttpRequest } from '@secbox/bus';

export interface UploadHarPayload {
  har: Har;
  filename: string;
  discard?: boolean;
}

export class UploadHar extends HttpRequest<FormData, { id: string }> {
  constructor({ filename, har, discard = false }: UploadHarPayload) {
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
