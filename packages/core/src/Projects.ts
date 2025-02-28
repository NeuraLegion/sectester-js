export interface Project {
  id: string;
  name: string;
}

export interface Projects {
  getDefaultProject(): Promise<Project>;
}

export const Projects: unique symbol = Symbol('Projects');
