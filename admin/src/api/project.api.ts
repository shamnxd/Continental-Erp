import { api } from "./index";
import { Project } from "../interfaces/project.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetProjectsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

export interface GetProjectsResponse {
  success: boolean;
  data: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectResponse {
  success: boolean;
  data: Project;
}

export async function getProjectsApi(query?: GetProjectsQuery): Promise<GetProjectsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.clientId) params.set("clientId", query.clientId);

  const qs = params.toString();
  const url = qs ? `${ApiRoute.PROJECTS}?${qs}` : ApiRoute.PROJECTS;
  return await api.get(url);
}

export async function getProjectByIdApi(id: string): Promise<ProjectResponse> {
  return await api.get(`${ApiRoute.PROJECTS}/${id}`);
}

export async function createProjectApi(data: Partial<Project>): Promise<ProjectResponse> {
  return await api.post(ApiRoute.PROJECTS, data);
}

export async function updateProjectApi(id: string, data: Partial<Project>): Promise<ProjectResponse> {
  return await api.put(`${ApiRoute.PROJECTS}/${id}`, data);
}

export async function deleteProjectApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.PROJECTS}/${id}`);
}

export async function uploadProjectHandoverApi(id: string, file: File): Promise<ProjectResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return await api.post(`${ApiRoute.PROJECTS}/${id}/handover`, formData);
}

