import { RequestExecutor } from './RequestExecutor';
import { HttpRequestExecutor } from './HttpRequestExecutor';
import { WsRequestExecutor } from './WsRequestExecutor';
import { RequestExecutorOptions } from './RequestExecutorOptions';
import { container } from 'tsyringe';

export * from './HttpRequestExecutor';
export * from './Protocol';
export * from './Request';
export * from './RequestExecutor';
export * from './RequestExecutorOptions';
export * from './Response';
export * from './WsRequestExecutor';

container.register(RequestExecutorOptions, {
  useValue: {
    timeout: 10000,
    maxContentLength: 100,
    reuseConnection: false,
    whitelistMimes: [
      'text/html',
      'text/plain',
      'text/css',
      'text/javascript',
      'text/markdown',
      'text/xml',
      'application/javascript',
      'application/x-javascript',
      'application/json',
      'application/xml',
      'application/x-www-form-urlencoded',
      'application/msgpack',
      'application/ld+json',
      'application/graphql'
    ]
  }
});

container.register(RequestExecutor, {
  useClass: HttpRequestExecutor
});

container.register(RequestExecutor, {
  useClass: WsRequestExecutor
});
