import { container } from 'tsyringe';

container.register('tsyringe', { useValue: container });

export default container;
