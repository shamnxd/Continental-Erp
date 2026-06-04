import { IBaseRepository } from "./IBaseRepository";
import { ILeaveRequest, LeaveStatus } from "../models/ILeaveRequest";

export interface GetLeavesQuery {
  staffId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLeaves {
  data: ILeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ILeaveRequestRepository extends IBaseRepository<ILeaveRequest> {
  findPaginated(query: GetLeavesQuery): Promise<PaginatedLeaves>;
  updateStatus(id: string, status: LeaveStatus, adminNote?: string): Promise<ILeaveRequest | null>;
}
