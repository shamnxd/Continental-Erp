import { IWarranty } from "../models/IWarranty";

export interface GetWarrantiesQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  projectId?: string;
}

export interface PaginatedWarranties {
  data: IWarranty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IWarrantyRepository {
  create(item: Partial<IWarranty>): Promise<IWarranty>;
  findById(id: string): Promise<IWarranty | null>;
  findByProjectId(projectId: string): Promise<IWarranty | null>;
  findPaginated(query: GetWarrantiesQuery): Promise<PaginatedWarranties>;
  update(id: string, data: Partial<IWarranty>): Promise<IWarranty | null>;
  delete(id: string): Promise<boolean>;
}
