import { HttpRequest } from '@sec-tester/bus';

export type ListRepeatersResponsePayload = { id: string; name: string }[];

export class ListRepeatersRequest extends HttpRequest<
  undefined,
  ListRepeatersResponsePayload
> {
  constructor() {
    super({ url: '/api/v1/repeaters', method: 'GET', payload: undefined });
  }
}
