import { api } from "./index";
import { Warranty, PaginatedWarranties } from "../interfaces/warranty.interface";
import { Project } from "../interfaces/project.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetWarrantiesQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  projectId?: string;
}

export interface WarrantyResponse {
  success: boolean;
  data: Warranty;
}

export async function getWarrantiesApi(query?: GetWarrantiesQuery): Promise<PaginatedWarranties> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.clientId) params.set("clientId", query.clientId);
  if (query?.projectId) params.set("projectId", query.projectId);

  const qs = params.toString();
  const url = qs ? `${ApiRoute.WARRANTIES}?${qs}` : ApiRoute.WARRANTIES;
  return await api.get(url);
}

export async function getWarrantyByIdApi(id: string): Promise<WarrantyResponse> {
  return await api.get(`${ApiRoute.WARRANTIES}/${id}`);
}

export async function createWarrantyApi(data: Partial<Warranty>): Promise<WarrantyResponse> {
  const payload = {
    ...data,
    clientRef: typeof data.clientRef === "object" ? (data.clientRef as any).id : data.clientRef,
    projectRef: typeof data.projectRef === "object" ? (data.projectRef as any)?.id : data.projectRef
  };
  return await api.post(ApiRoute.WARRANTIES, payload);
}

export async function updateWarrantyApi(id: string, data: Partial<Warranty>): Promise<WarrantyResponse> {
  const payload = {
    ...data,
    clientRef: typeof data.clientRef === "object" ? (data.clientRef as any).id : data.clientRef,
    projectRef: typeof data.projectRef === "object" ? (data.projectRef as any)?.id : data.projectRef
  };
  return await api.put(`${ApiRoute.WARRANTIES}/${id}`, payload);
}

export async function getWarrantyByProjectIdApi(projectId: string): Promise<WarrantyResponse> {
  return await api.get(`${ApiRoute.WARRANTIES}/project/${projectId}`);
}

export async function getCompletedProjectsWithoutWarrantyApi(): Promise<{ success: boolean; data: Project[] }> {
  return await api.get(`${ApiRoute.PROJECTS}/completed-without-warranty`);
}
