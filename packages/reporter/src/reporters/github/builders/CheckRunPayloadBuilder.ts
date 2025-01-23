import type { CheckRunPayload } from '../types';

export interface CheckRunPayloadBuilder {
  build(): CheckRunPayload;
}
