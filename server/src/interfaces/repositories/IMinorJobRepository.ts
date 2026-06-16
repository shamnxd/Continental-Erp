import { IMinorJob } from "../models/IMinorJob";

export interface GetMinorJobsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

export interface PaginatedMinorJobs {
  data: IMinorJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IMinorJobRepository {
  create(item: Partial<IMinorJob>): Promise<IMinorJob>;
  findById(id: string): Promise<IMinorJob | null>;
  findPaginated(query: GetMinorJobsQuery): Promise<PaginatedMinorJobs>;
  update(id: string, data: Partial<IMinorJob>): Promise<IMinorJob | null>;
  delete(id: string): Promise<boolean>;
}
