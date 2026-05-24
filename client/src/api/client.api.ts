import { api } from "./index";
import { Client } from "../interfaces/client.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetClientsQuery {
  search?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "active-amc" | "expired-amc" | "active-complaints" | "active-enquiries";
  companyNames?: string[];
}

export interface GetClientsResponse {
  success: boolean;
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientResponse {
  success: boolean;
  data: Client;
}

export async function getClientsApi(query?: GetClientsQuery): Promise<GetClientsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.filter && query.filter !== "all") params.set("filter", query.filter);
  if (query?.companyNames && query.companyNames.length > 0) {
    params.set("companyNames", query.companyNames.join(","));
  }

  const queryString = params.toString();
  const url = queryString ? `${ApiRoute.CLIENTS}?${queryString}` : ApiRoute.CLIENTS;
  return await api.get(url);
}

export async function createClientApi(clientData: Omit<Client, "id" | "projectsCount" | "amcStatus"> & { amcStatus?: "Active" | "Inactive" | "Expired" }): Promise<ClientResponse> {
  return await api.post(ApiRoute.CLIENTS, clientData);
}

export async function updateClientApi(id: string, clientData: Partial<Client>): Promise<ClientResponse> {
  return await api.put(`${ApiRoute.CLIENTS}/${id}`, clientData);
}

export async function deleteClientApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.CLIENTS}/${id}`);
}

export async function getClientByIdApi(id: string): Promise<ClientResponse> {
  return await api.get(`${ApiRoute.CLIENTS}/${id}`);
}


