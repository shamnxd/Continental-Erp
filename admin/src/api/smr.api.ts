import { api } from "./index";
import { SMR } from "../interfaces/smr.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface SMRResponse {
  success: boolean;
  data: SMR;
}

export interface SMRListResponse {
  success: boolean;
  data: SMR[];
}

export async function createSMRApi(
  smrData: Omit<SMR, "id" | "smrNo" | "approval" | "status" | "jobNumber"> & { status?: string; jobNumber?: string }
): Promise<SMRResponse> {
  return await api.post(ApiRoute.SMRS, smrData);
}

export async function getSMRByIdApi(id: string): Promise<SMRResponse> {
  return await api.get(`${ApiRoute.SMRS}/${id}`);
}

export async function getSMRsByComplaintApi(complaintId: string): Promise<SMRListResponse> {
  return await api.get(`${ApiRoute.SMRS}/by-complaint?complaintId=${complaintId}`);
}

export async function updateSMRApi(id: string, smrData: Partial<SMR>): Promise<SMRResponse> {
  return await api.put(`${ApiRoute.SMRS}/${id}`, smrData);
}

export async function approveSMRApi(
  id: string,
  approvalData: { clientRepName: string }
): Promise<SMRResponse> {
  return await api.post(`${ApiRoute.SMRS}/${id}/approve`, approvalData);
}
