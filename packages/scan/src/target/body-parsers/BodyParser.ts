import { Target } from '../Target';
import { Param } from '@har-sdk/core';

export interface ParsedBody {
  text: string;
  contentType: string;
  params?: Param[];
}

export interface BodyParser {
  canParse(target: Target): boolean;

  parse(target: Target): ParsedBody | undefined;
}

export const BodyParser: unique symbol = Symbol('BodyParser');
