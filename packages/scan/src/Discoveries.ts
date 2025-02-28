import { Target } from './target';

export interface Discoveries {
  createEntrypoint(
    target: Target,
    repeaterId?: string
  ): Promise<{ id: string }>;
}

export const Discoveries: unique symbol = Symbol('Discoveries');
