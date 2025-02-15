export interface ApiClient {
  request(path: string, options?: RequestInit): Promise<Response>;
}

export const ApiClient: unique symbol = Symbol('ApiClient');
