import { promisify } from 'util';

export const delay = (ms: number) => promisify(setTimeout)(ms);
