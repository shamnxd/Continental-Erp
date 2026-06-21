import { api } from "./index";
import { Complaint } from "../interfaces/complaint.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetComplaintsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  clientId?: string;
}

export interface GetComplaintsResponse {
  success: boolean;
  data: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ComplaintResponse {
  success: boolean;
  data: Complaint;
}

export async function getComplaintsApi(query?: GetComplaintsQuery): Promise<GetComplaintsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.priority) params.set("priority", query.priority);
  if (query?.clientId) params.set("clientId", query.clientId);

  const queryString = params.toString();
  const url = queryString ? `${ApiRoute.COMPLAINTS}?${queryString}` : ApiRoute.COMPLAINTS;
  return await api.get(url);
}

export async function createComplaintApi(complaintData: Omit<Complaint, "id" | "complaintNo" | "remarks"> & { remarks?: any[] }): Promise<ComplaintResponse> {
  return await api.post(ApiRoute.COMPLAINTS, complaintData);
}

export async function updateComplaintApi(id: string, complaintData: Partial<Complaint>): Promise<ComplaintResponse> {
  return await api.put(`${ApiRoute.COMPLAINTS}/${id}`, complaintData);
}

export async function deleteComplaintApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.COMPLAINTS}/${id}`);
}

export async function getComplaintByIdApi(id: string): Promise<ComplaintResponse> {
  return await api.get(`${ApiRoute.COMPLAINTS}/${id}`);
}

export async function getComplaintsStatsApi(): Promise<{
  success: boolean;
  data: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
}> {
  return await api.get(`${ApiRoute.COMPLAINTS}/stats`);
}
