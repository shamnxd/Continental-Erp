import { api } from "./index";
import { Staff, StaffWorkHistoryItem } from "../interfaces/staff.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetStaffQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  employmentType?: string;
  activeOnly?: boolean;
}

export interface GetStaffResponse {
  success: boolean;
  data: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StaffResponse {
  success: boolean;
  data: Staff;
}

export interface StaffWorkHistoryResponse {
  success: boolean;
  data: StaffWorkHistoryItem[];
}

export async function getStaffApi(query?: GetStaffQuery): Promise<GetStaffResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.employmentType && query.employmentType !== "all") {
    params.set("employmentType", query.employmentType);
  }
  if (query?.activeOnly === false) params.set("activeOnly", "false");

  const qs = params.toString();
  const url = qs ? `${ApiRoute.STAFF}?${qs}` : ApiRoute.STAFF;
  return await api.get(url);
}

export async function getStaffByIdApi(id: string): Promise<StaffResponse> {
  return await api.get(`${ApiRoute.STAFF}/${id}`);
}

export async function getStaffWorkHistoryApi(id: string): Promise<StaffWorkHistoryResponse> {
  return await api.get(`${ApiRoute.STAFF}/${id}/work-history`);
}

export async function createStaffApi(
  data: Omit<Staff, "id" | "staffNo" | "createdAt" | "updatedAt">
): Promise<StaffResponse> {
  return await api.post(ApiRoute.STAFF, data);
}

export async function updateStaffApi(id: string, data: Partial<Staff>): Promise<StaffResponse> {
  return await api.put(`${ApiRoute.STAFF}/${id}`, data);
}

export async function deleteStaffApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.STAFF}/${id}`);
}

export async function changeStaffPasswordApi(
  id: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  return await api.put(`${ApiRoute.STAFF}/${id}/password`, { password });
}
