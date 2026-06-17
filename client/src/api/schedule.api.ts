import { api } from "./index";
import { Schedule } from "../interfaces/schedule.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetSchedulesQuery {
  entityType?: "enquiry" | "complaint" | "amc" | "project" | "minorjob";
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetSchedulesResponse {
  success: boolean;
  data: Schedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScheduleResponse {
  success: boolean;
  data: Schedule;
}

export async function getSchedulesApi(query?: GetSchedulesQuery): Promise<GetSchedulesResponse> {
  const params = new URLSearchParams();
  if (query?.entityType) params.set("entityType", query.entityType);
  if (query?.entityId) params.set("entityId", query.entityId);
  if (query?.startDate) params.set("startDate", query.startDate);
  if (query?.endDate) params.set("endDate", query.endDate);
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));

  const queryString = params.toString();
  const url = queryString ? `${ApiRoute.SCHEDULES}?${queryString}` : ApiRoute.SCHEDULES;
  return await api.get(url);
}

export async function getScheduleByIdApi(id: string): Promise<ScheduleResponse> {
  return await api.get(`${ApiRoute.SCHEDULES}/${id}`);
}

export async function createScheduleApi(data: Partial<Schedule>): Promise<ScheduleResponse> {
  return await api.post(ApiRoute.SCHEDULES, data);
}

export async function updateScheduleApi(id: string, data: Partial<Schedule>): Promise<ScheduleResponse> {
  return await api.put(`${ApiRoute.SCHEDULES}/${id}`, data);
}

export async function deleteScheduleApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.SCHEDULES}/${id}`);
}

export async function completeScheduleApi(
  id: string,
  data: {
    completedAt: string;
    completionNotes?: string;
    file?: File | null;
  }
): Promise<ScheduleResponse> {
  const formData = new FormData();
  formData.append("completedAt", data.completedAt);
  if (data.completionNotes) {
    formData.append("completionNotes", data.completionNotes);
  }
  if (data.file) {
    formData.append("file", data.file);
  }
  return await api.put(`${ApiRoute.SCHEDULES}/${id}/complete`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
