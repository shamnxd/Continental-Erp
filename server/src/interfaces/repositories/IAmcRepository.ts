import { IAmc } from "../models/IAmc";

export interface GetAmcQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

export interface PaginatedAmc {
  data: IAmc[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAmcRepository {
  create(item: Partial<IAmc>): Promise<IAmc>;
  findById(id: string): Promise<IAmc | null>;
  findPaginated(query: GetAmcQuery): Promise<PaginatedAmc>;
  update(id: string, data: Partial<IAmc>): Promise<IAmc | null>;
  delete(id: string): Promise<boolean>;
  countActiveByClientId(clientId: string): Promise<number>;
}
