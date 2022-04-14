import { HttpRepeatersManager } from './HttpRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { container } from 'tsyringe';
import { CommandDispatcher } from '@secbox/core';

container.register(CommandDispatcher, { useClass: HttpRepeatersManager });

container.register(RepeatersManager, { useClass: HttpRepeatersManager });
