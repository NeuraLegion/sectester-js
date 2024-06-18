import { HttpRequest } from '@sectester/core';

export interface GetRepeaterResponsePayload {
  id: string;
  name: string;
  projectIds: string[];
}

export class GetRepeaterRequest extends HttpRequest<
  undefined,
  GetRepeaterResponsePayload
> {
  constructor(repeaterId: string) {
    super({
      url: `/api/v1/repeaters/${repeaterId}`,
      method: 'GET',
      payload: undefined
    });
  }
}
