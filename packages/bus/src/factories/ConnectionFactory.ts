export interface ConnectionFactory<T> {
  create(url: string, options?: Record<string, unknown>): Promise<T>;
}

export const ConnectionFactory: unique symbol = Symbol('ConnectionFactory');
