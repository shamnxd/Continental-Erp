import { api } from "./index";
import { Subcontract } from "../interfaces/subcontract.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface SubcontractsResponse {
  success: boolean;
  data: Subcontract[];
}

export interface SubcontractResponse {
  success: boolean;
  data: Subcontract;
}

export async function getSubcontractsApi(projectId: string): Promise<SubcontractsResponse> {
  return await api.get(`${ApiRoute.PROJECTS}/${projectId}/subcontracts`);
}

export async function getAllSubcontractsApi(): Promise<SubcontractsResponse> {
  return await api.get(`${ApiRoute.PROJECTS}/all-subcontracts`);
}

export async function createSubcontractApi(
  projectId: string,
  data: Partial<Subcontract>
): Promise<SubcontractResponse> {
  return await api.post(`${ApiRoute.PROJECTS}/${projectId}/subcontracts`, data);
}

export async function updateSubcontractApi(
  projectId: string,
  subcontractId: string,
  data: Partial<Subcontract>
): Promise<SubcontractResponse> {
  return await api.put(`${ApiRoute.PROJECTS}/${projectId}/subcontracts/${subcontractId}`, data);
}

export async function deleteSubcontractApi(
  projectId: string,
  subcontractId: string
): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.PROJECTS}/${projectId}/subcontracts/${subcontractId}`);
}

export async function uploadSubcontractReportApi(
  projectId: string,
  subcontractId: string,
  file: File
): Promise<SubcontractResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return await api.post(`${ApiRoute.PROJECTS}/${projectId}/subcontracts/${subcontractId}/report`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

