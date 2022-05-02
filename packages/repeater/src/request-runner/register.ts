import { RequestRunner } from './RequestRunner';
import { HttpRequestRunner, WsRequestRunner } from './protocols';
import { container } from 'tsyringe';

container.register(RequestRunner, {
  useClass: HttpRequestRunner
});

container.register(RequestRunner, {
  useClass: WsRequestRunner
});
