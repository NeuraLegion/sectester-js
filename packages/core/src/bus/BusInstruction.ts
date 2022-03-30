import { randomBytes } from 'crypto';

export abstract class BusInstruction<T> {
  public readonly type!: string;
  public readonly payload!: T;
  public readonly correlationId!: string;
  public readonly createdAt!: Date;

  constructor(
    payload: T,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    this.payload = payload;
    this.type = type || this.getType(payload);
    this.correlationId =
      correlationId || randomBytes(32).toString('hex').slice(0, 32);
    this.createdAt = createdAt || new Date();
  }

  private getType(payload: T) {
    const { constructor } = Object.getPrototypeOf(payload);

    return constructor.name as string;
  }
}
