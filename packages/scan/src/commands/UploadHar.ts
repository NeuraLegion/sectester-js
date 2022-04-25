import { Har } from '../HarEntryBuilder';
import FormData from 'form-data';
import { HttpOptions, HttpRequest } from '@secbox/bus';

export interface UploadHarPayload {
  har: Har;
  filename: string;
  discard?: boolean;
}
export class UploadHar extends HttpRequest<FormData, { id: string }> {
  constructor(fileOptions: UploadHarPayload) {
    const { filename, har, discard } = fileOptions;
    const payload = new FormData();
    payload.append('file', JSON.stringify(har), {
      filename,
      contentType: 'application/json'
    });

    const optins: HttpOptions<FormData> = {
      payload,
      url: '/api/v1/files',
      params: { discard },
      method: 'POST'
    };

    super(optins);
  }
}
