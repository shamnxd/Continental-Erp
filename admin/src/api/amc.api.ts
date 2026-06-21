import { api } from "./index";
import {
  AmcContract,
  AmcVisit,
  CreateAmcPayload,
  ScheduleAmcVisitPayload,
  UpdateAmcPayload,
} from "../interfaces/amc.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface GetAmcQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

export interface GetAmcResponse {
  success: boolean;
  data: AmcContract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AmcResponse {
  success: boolean;
  data: AmcContract;
}

export async function getAmcApi(query?: GetAmcQuery): Promise<GetAmcResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.clientId) params.set("clientId", query.clientId);

  const qs = params.toString();
  const url = qs ? `${ApiRoute.AMC}?${qs}` : ApiRoute.AMC;
  return await api.get(url);
}

export async function getAmcByIdApi(id: string): Promise<AmcResponse> {
  return await api.get(`${ApiRoute.AMC}/${id}`);
}

export async function createAmcApi(data: CreateAmcPayload): Promise<AmcResponse> {
  return await api.post(ApiRoute.AMC, data);
}

export async function updateAmcApi(id: string, data: UpdateAmcPayload): Promise<AmcResponse> {
  return await api.put(`${ApiRoute.AMC}/${id}`, data);
}

export async function deleteAmcApi(id: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.AMC}/${id}`);
}

export async function getAmcVisitsApi(amcId: string): Promise<{ success: boolean; data: AmcVisit[] }> {
  return await api.get(`${ApiRoute.AMC}/${amcId}/visits`);
}

export async function scheduleAmcVisitApi(
  amcId: string,
  data: ScheduleAmcVisitPayload
): Promise<{ success: boolean; data: AmcVisit }> {
  return await api.post(`${ApiRoute.AMC}/${amcId}/visits`, data);
}

export async function updateAmcVisitApi(
  amcId: string,
  visitId: string,
  data: {
    status?: string;
    scheduledDate?: string;
    notes?: string;
    assignedStaffIds?: string[];
    smrId?: string;
  }
): Promise<{ success: boolean; data: AmcVisit }> {
  return await api.patch(`${ApiRoute.AMC}/${amcId}/visits/${visitId}`, data);
}

export async function addAmcRemarkApi(
  amcId: string,
  text: string
): Promise<{ success: boolean; data: AmcContract }> {
  return await api.post(`${ApiRoute.AMC}/${amcId}/remarks`, { text });
}

export async function updateAmcRemarkApi(
  amcId: string,
  remarkKey: string,
  text: string,
): Promise<{ success: boolean; data: AmcContract }> {
  return await api.put(`${ApiRoute.AMC}/${amcId}/remarks/${remarkKey}`, { text });
}

export async function recordAmcPaymentApi(
  amcId: string,
  data: { amount: number; type: "Advance" | "Payment"; note?: string }
): Promise<{ success: boolean; data: AmcContract }> {
  return await api.post(`${ApiRoute.AMC}/${amcId}/payments`, data);
}

export async function getAmcVisitSmrApi(
  amcId: string,
  visitId: string
): Promise<{ success: boolean; data: import("../interfaces/smr.interface").SMR }> {
  return await api.get(`${ApiRoute.AMC}/${amcId}/visits/${visitId}/smr`);
}

export async function getAmcStatsApi(): Promise<{
  success: boolean;
  data: {
    total: number;
    active: number;
    renewal: number;
    expired: number;
  };
}> {
  return await api.get(`${ApiRoute.AMC}/stats`);
}
