import { HttpRequest } from '@sectester/bus';

interface CreateRepeaterRequestPayload {
  name: string;
  description?: string;
}

export class CreateRepeaterRequest extends HttpRequest<CreateRepeaterRequestPayload> {
  constructor(payload: CreateRepeaterRequestPayload) {
    super({
      payload,
      url: '/api/v1/repeaters',
      method: 'POST'
    });
  }
}
