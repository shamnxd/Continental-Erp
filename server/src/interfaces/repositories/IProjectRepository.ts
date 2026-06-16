import { IProject } from "../models/IProject";

export interface GetProjectsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

export interface PaginatedProjects {
  data: IProject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProjectRepository {
  create(item: Partial<IProject>): Promise<IProject>;
  findById(id: string): Promise<IProject | null>;
  findPaginated(query: GetProjectsQuery): Promise<PaginatedProjects>;
  update(id: string, data: Partial<IProject>): Promise<IProject | null>;
  delete(id: string): Promise<boolean>;
  countActiveByClientId(clientId: string): Promise<number>;
}
