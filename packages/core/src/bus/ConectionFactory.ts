export interface ConnectionFactory<T> {
  create(url: string, options?: any): Promise<T>;
}

export const ConnectionFactory: unique symbol = Symbol('ConnectionFactory');
