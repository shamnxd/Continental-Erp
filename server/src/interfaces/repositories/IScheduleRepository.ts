import { ISchedule } from "../models/ISchedule";
import { IBaseRepository } from "./IBaseRepository";

export interface GetSchedulesQuery {
  entityType?: "enquiry" | "complaint" | "amc" | "project" | "minorjob";
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSchedules {
  data: ISchedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IScheduleRepository extends IBaseRepository<ISchedule> {
  findPaginated(query: GetSchedulesQuery): Promise<PaginatedSchedules>;
  findByEntity(entityType: string, entityId: string): Promise<ISchedule[]>;
}
