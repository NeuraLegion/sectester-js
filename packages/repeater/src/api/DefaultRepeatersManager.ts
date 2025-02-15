import { RepeatersManager } from './RepeatersManager';
import { inject, injectable } from 'tsyringe';
import { ApiClient, ApiError } from '@sectester/core';

@injectable()
export class DefaultRepeatersManager implements RepeatersManager {
  constructor(
    @inject(ApiClient)
    private readonly client: ApiClient
  ) {}

  public async getRepeater(
    repeaterId: string
  ): Promise<{ repeaterId: string }> {
    try {
      const response = await this.client.request(
        `/api/v1/repeaters/${repeaterId}`
      );
      const repeater = (await response.json()) as {
        id: string;
        name: string;
        projectIds: string[];
      };

      return { repeaterId: repeater.id };
    } catch (error) {
      if (error instanceof ApiError && error.response.status === 404) {
        throw new Error('Cannot find repeater');
      }

      throw error;
    }
  }

  public async createRepeater({
    projectId,
    ...options
  }: {
    name: string;
    description?: string;
    projectId?: string;
  }): Promise<{ repeaterId: string }> {
    try {
      const response = await this.client.request('/api/v1/repeaters', {
        method: 'POST',
        body: JSON.stringify({
          ...options,
          ...(projectId ? { projectIds: [projectId] } : {})
        } satisfies {
          name: string;
          description?: string;
          projectIds?: string[];
        })
      });
      const repeater = (await response.json()) as { id: string };

      return { repeaterId: repeater.id };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error('Cannot create a new repeater');
      }
      throw error;
    }
  }

  public async deleteRepeater(repeaterId: string): Promise<void> {
    try {
      await this.client.request(`/api/v1/repeaters/${repeaterId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      if (error instanceof ApiError && error.response.status === 404) {
        return;
      }
      throw error;
    }
  }
}
