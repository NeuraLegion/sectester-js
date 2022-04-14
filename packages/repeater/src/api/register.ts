import { HttpRepeatersManager } from './HttpRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { container } from 'tsyringe';

container.register(RepeatersManager, { useClass: HttpRepeatersManager });
