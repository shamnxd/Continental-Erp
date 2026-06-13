import { api } from "./index";
import { Enquiry } from "../interfaces/enquiry.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetEnquiriesQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  clientId?: string;
}

export interface GetEnquiriesResponse {
  success: boolean;
  data: Enquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnquiryResponse {
  success: boolean;
  data: Enquiry;
}

export async function getEnquiriesApi(query?: GetEnquiriesQuery): Promise<GetEnquiriesResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.priority) params.set("priority", query.priority);
  if (query?.clientId) params.set("clientId", query.clientId);

  const queryString = params.toString();
  const url = queryString ? `${ApiRoute.ENQUIRIES}?${queryString}` : ApiRoute.ENQUIRIES;
  return await api.get(url);
}

export async function createEnquiryApi(
  data: Omit<Enquiry, "id" | "enquiryNo" | "drawings"> & { drawings?: Enquiry["drawings"] },
): Promise<EnquiryResponse> {
  return await api.post(ApiRoute.ENQUIRIES, data);
}

export async function updateEnquiryApi(id: string, data: Partial<Enquiry>): Promise<EnquiryResponse> {
  return await api.put(`${ApiRoute.ENQUIRIES}/${id}`, data);
}

export async function deleteEnquiryApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.ENQUIRIES}/${id}`);
}

export async function getEnquiryByIdApi(id: string): Promise<EnquiryResponse> {
  return await api.get(`${ApiRoute.ENQUIRIES}/${id}`);
}

export async function addEnquiryRemarkApi(id: string, text: string): Promise<EnquiryResponse> {
  return await api.post(`${ApiRoute.ENQUIRIES}/${id}/remarks`, { text });
}

export async function updateEnquiryRemarkApi(
  enquiryId: string,
  remarkKey: string,
  text: string,
): Promise<EnquiryResponse> {
  return await api.put(`${ApiRoute.ENQUIRIES}/${enquiryId}/remarks/${remarkKey}`, { text });
}

export async function uploadEnquiryDrawingApi(id: string, file: File): Promise<EnquiryResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return await api.post(`${ApiRoute.ENQUIRIES}/${id}/drawings`, formData);
}

export async function getEnquiriesStatsApi(): Promise<{
  success: boolean;
  data: {
    total: number;
    siteVisit: number;
    quotation: number;
    followUp: number;
    converted: number;
    closed: number;
  };
}> {
  return await api.get(`${ApiRoute.ENQUIRIES}/stats`);
}
