import { api } from "./index";
import { MinorJob } from "../interfaces/minorJob.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetMinorJobsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

export interface GetMinorJobsResponse {
  success: boolean;
  data: MinorJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MinorJobResponse {
  success: boolean;
  data: MinorJob;
}

export async function getMinorJobsApi(query?: GetMinorJobsQuery): Promise<GetMinorJobsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.clientId) params.set("clientId", query.clientId);

  const qs = params.toString();
  const url = qs ? `${ApiRoute.MINOR_JOBS}?${qs}` : ApiRoute.MINOR_JOBS;
  return await api.get(url);
}

export async function getMinorJobByIdApi(id: string): Promise<MinorJobResponse> {
  return await api.get(`${ApiRoute.MINOR_JOBS}/${id}`);
}

export async function createMinorJobApi(data: Partial<MinorJob>): Promise<MinorJobResponse> {
  return await api.post(ApiRoute.MINOR_JOBS, data);
}

export async function updateMinorJobApi(id: string, data: Partial<MinorJob>): Promise<MinorJobResponse> {
  return await api.put(`${ApiRoute.MINOR_JOBS}/${id}`, data);
}

export async function deleteMinorJobApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.MINOR_JOBS}/${id}`);
}
