import FormData from 'form-data';
import { HttpOptions, HttpRequest } from '@secbox/bus';

export interface UploadFileOptions {
  filename: string;
  content: string;
}

export class UploadHar extends HttpRequest<FormData, { id: string }> {
  constructor(fileOptions: UploadFileOptions, query: Record<string, unknown>) {
    const payload = new FormData();
    payload.append('file', fileOptions.content, fileOptions.filename);
    const optins: HttpOptions<FormData> = {
      payload,
      url: '/api/v1/files',
      params: query,
      method: 'POST',
      headers: payload.getHeaders()
    };

    super(optins);
  }
}
