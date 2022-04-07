export interface Repeaters {
  createRepeater(options: {
    name: string;
    description?: string;
  }): Promise<{ repeaterId: string }>;

  deleteRepeater(repeaterId: string): Promise<void>;
}

export const Repeaters: unique symbol = Symbol('Repeaters');
