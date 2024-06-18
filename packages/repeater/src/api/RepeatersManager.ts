export interface RepeatersManager {
  createRepeater(options: {
    name: string;
    projectId?: string;
    description?: string;
  }): Promise<{ repeaterId: string }>;

  deleteRepeater(repeaterId: string): Promise<void>;
}

export const RepeatersManager: unique symbol = Symbol('RepeatersManager');
