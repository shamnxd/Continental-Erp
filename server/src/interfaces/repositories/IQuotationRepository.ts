import { IBaseRepository } from "./IBaseRepository";
import { IQuotation } from "../models/IQuotation";

export interface GetQuotationsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  enquiryId?: string;
  quotationNo?: string;
}

export interface PaginatedQuotations {
  data: IQuotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IQuotationRepository extends IBaseRepository<IQuotation> {
  findPaginated(query: GetQuotationsQuery): Promise<PaginatedQuotations>;
  getNextRevisionNumber(quotationNo: string): Promise<number>;
  deactivateAllForNo(quotationNo: string): Promise<void>;
}
