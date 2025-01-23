import type { CheckRunPayload } from './CheckRunPayload';

export type CheckRunAnnotation = NonNullable<
  NonNullable<CheckRunPayload['output']>['annotations']
>[number];
