import { Scans } from './Scans';
import { DefaultScans } from './DefaultScans';
import { container } from 'tsyringe';

container.register(Scans, { useClass: DefaultScans });
