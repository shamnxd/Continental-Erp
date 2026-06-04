import { IBaseRepository } from "./IBaseRepository";
import { IAuditLog } from "../models/IAuditLog";

export interface GetAuditLogsQuery {
  search?: string;
  module?: string;
  user?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: IAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    all: number;
    Clients: number;
    AMC: number;
    Complaints: number;
    Staff: number;
    Finance: number;
    Administration: number;
  };
}

export interface IAuditLogRepository extends IBaseRepository<IAuditLog> {
  findPaginated(query: GetAuditLogsQuery): Promise<PaginatedAuditLogs>;
}
