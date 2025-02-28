import { Project, Projects } from './Projects';
import { ApiClient } from './api';
import { inject, injectable } from 'tsyringe';

@injectable()
export class DefaultProjects implements Projects {
  constructor(@inject(ApiClient) private readonly client: ApiClient) {}

  public async getDefaultProject(): Promise<Project> {
    const filters = new URLSearchParams();
    filters.set('predefined', true.toString());
    const response = await this.client.request(
      `/api/v2/projects?${filters.toString()}`
    );
    const {
      items: [project]
    }: { items: Project[] } = (await response.json()) as { items: Project[] };

    if (!project) {
      throw new Error('No default project found');
    }

    return project;
  }
}
