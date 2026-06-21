import { api } from "./index";
import { Quotation } from "../interfaces/quotation.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetQuotationsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  enquiryId?: string;
  quotationNo?: string;
  allRevisions?: boolean;
}

export interface GetQuotationsResponse {
  success: boolean;
  data: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuotationResponse {
  success: boolean;
  data: Quotation;
}

export async function getQuotationsApi(query?: GetQuotationsQuery): Promise<GetQuotationsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.clientId) params.set("clientId", query.clientId);
  if (query?.enquiryId) params.set("enquiryId", query.enquiryId);
  if (query?.quotationNo) params.set("quotationNo", query.quotationNo);
  if (query?.allRevisions) params.set("allRevisions", String(query.allRevisions));

  const queryString = params.toString();
  const url = queryString ? `${ApiRoute.QUOTATIONS}?${queryString}` : ApiRoute.QUOTATIONS;
  return await api.get(url);
}

export async function createQuotationApi(
  data: Omit<Quotation, "id" | "quotationNo" | "amount" | "gst" | "total" | "remarks"> & {
    amount?: number;
    gst?: number;
    total?: number;
  },
): Promise<QuotationResponse> {
  return await api.post(ApiRoute.QUOTATIONS, data);
}

export async function updateQuotationApi(id: string, data: Partial<Quotation>): Promise<QuotationResponse> {
  return await api.put(`${ApiRoute.QUOTATIONS}/${id}`, data);
}

export async function deleteQuotationApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.QUOTATIONS}/${id}`);
}

export async function getQuotationByIdApi(id: string): Promise<QuotationResponse> {
  return await api.get(`${ApiRoute.QUOTATIONS}/${id}`);
}

export async function createQuotationRevisionApi(id: string): Promise<QuotationResponse> {
  return await api.post(`${ApiRoute.QUOTATIONS}/${id}/revision`);
}

export async function addQuotationRemarkApi(id: string, text: string): Promise<QuotationResponse> {
  return await api.post(`${ApiRoute.QUOTATIONS}/${id}/remarks`, { text });
}

export async function updateQuotationRemarkApi(
  quotationId: string,
  remarkKey: string,
  text: string,
): Promise<QuotationResponse> {
  return await api.put(`${ApiRoute.QUOTATIONS}/${quotationId}/remarks/${remarkKey}`, { text });
}

export async function getQuotationsStatsApi(): Promise<{
  success: boolean;
  data: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
  };
}> {
  return await api.get(`${ApiRoute.QUOTATIONS}/stats`);
}

export async function convertQuotationApi(
  id: string,
  data: {
    targetType: "project" | "amc" | "minorjob";
    data: {
      name?: string;
      startDate?: string;
      value?: number;
      startDateAmc?: string;
      endDateAmc?: string;
      frequency?: string;
      serviceType?: string;
      notes?: string;
      description?: string;
      scheduledDate?: string;
      assignedTo?: string;
      assignedStaffId?: string;
    };
  }
): Promise<QuotationResponse> {
  return await api.post(`${ApiRoute.QUOTATIONS}/${id}/convert`, data);
}
