import { RequestRunnerOptions } from './RequestRunnerOptions';
import { RequestRunner } from './RequestRunner';
import { HttpRequestRunner, WsRequestRunner } from './protocols';
import { container } from 'tsyringe';

container.register(RequestRunnerOptions, {
  useValue: {
    timeout: 30000,
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

container.register(RequestRunner, {
  useClass: HttpRequestRunner
});

container.register(RequestRunner, {
  useClass: WsRequestRunner
});
