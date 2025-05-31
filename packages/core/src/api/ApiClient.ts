export interface ApiRequestInit extends RequestInit {
  handle409Redirects?: boolean;
}

export interface ApiClient {
  request(path: string, options?: ApiRequestInit): Promise<Response>;
}

export const ApiClient: unique symbol = Symbol('ApiClient');
