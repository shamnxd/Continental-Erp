import { api } from "./index";
import { ApiRoute } from "../constants/routes.enum";

export interface ComplaintRequest {
  id: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  location: string;
  issue: string;
  description: string;
  status: "Pending" | "Converted" | "Rejected";
  convertedComplaintId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetComplaintRequestsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetComplaintRequestsResponse {
  success: boolean;
  data: ComplaintRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function submitPublicComplaintApi(data: {
  clientName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  location: string;
  issue: string;
  description: string;
}): Promise<{ success: boolean; message: string; data: ComplaintRequest }> {
  return await api.post(`${ApiRoute.COMPLAINT_REQUESTS}/public`, data);
}

export async function getComplaintRequestsApi(query?: GetComplaintRequestsQuery): Promise<GetComplaintRequestsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);

  const queryString = params.toString();
  const url = queryString ? `${ApiRoute.COMPLAINT_REQUESTS}?${queryString}` : ApiRoute.COMPLAINT_REQUESTS;
  return await api.get(url);
}

export async function rejectComplaintRequestApi(id: string): Promise<{ success: boolean; data: ComplaintRequest }> {
  return await api.put(`${ApiRoute.COMPLAINT_REQUESTS}/${id}/reject`);
}

export async function convertComplaintRequestApi(
  id: string,
  data: {
    clientId: string;
    priority: string;
    expectedResolution: string;
    assignedStaffIds?: string[];
  }
): Promise<{ success: boolean; data: { request: ComplaintRequest; complaint: any } }> {
  return await api.put(`${ApiRoute.COMPLAINT_REQUESTS}/${id}/convert`, data);
}
