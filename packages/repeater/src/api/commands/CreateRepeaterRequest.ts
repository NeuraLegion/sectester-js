import { HttpRequest } from '@sectester/core';

export interface CreateRepeaterRequestPayload {
  name: string;
  description?: string;
  projectIds?: string[];
}

export interface CreateRepeaterResponsePayload {
  id: string;
}

export class CreateRepeaterRequest extends HttpRequest<
  CreateRepeaterRequestPayload,
  CreateRepeaterResponsePayload
> {
  constructor(payload: CreateRepeaterRequestPayload) {
    super({
      payload,
      url: '/api/v1/repeaters',
      method: 'POST'
    });
  }
}
