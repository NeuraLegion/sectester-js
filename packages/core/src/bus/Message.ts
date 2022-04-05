import { getTypeName } from '../utils';
import { v4 } from 'uuid';

export abstract class Message<T> {
  public readonly type: string;
  public readonly correlationId: string;
  public readonly createdAt: Date;

  protected constructor(
    public readonly payload: T,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    this.type = type || getTypeName(this);
    this.correlationId = correlationId || v4();
    this.createdAt = createdAt || new Date();
  }
}
