import { RepeatersManager } from './RepeatersManager';
import { DefaultRepeatersManager } from './DefaultRepeatersManager';
import { container } from 'tsyringe';

container.register(RepeatersManager, { useClass: DefaultRepeatersManager });
