import { DefaultRepeatersManager } from './DefaultRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { container } from 'tsyringe';

container.register(RepeatersManager, { useClass: DefaultRepeatersManager });
