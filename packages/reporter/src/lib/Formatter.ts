import { Issue } from '@sectester/scan';

export interface Formatter {
  format(issue: Issue): string;
}

export const Formatter: unique symbol = Symbol('Formatter');
