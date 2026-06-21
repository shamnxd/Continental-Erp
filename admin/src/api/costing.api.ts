import { api } from "./index";
import { ICosting } from "../interfaces/costing.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface CostingResponse {
  success: boolean;
  data: ICosting;
}

export interface CostingsResponse {
  success: boolean;
  data: ICosting[];
}

export async function getCostingsByEnquiryIdApi(enquiryId: string): Promise<CostingsResponse> {
  return await api.get(`${ApiRoute.COSTINGS}/enquiry/${enquiryId}`);
}

export async function getCostingByIdApi(id: string): Promise<CostingResponse> {
  return await api.get(`${ApiRoute.COSTINGS}/${id}`);
}

export async function createCostingApi(data: Partial<ICosting>): Promise<CostingResponse> {
  return await api.post(ApiRoute.COSTINGS, data);
}

export async function updateCostingApi(id: string, data: Partial<ICosting>): Promise<CostingResponse> {
  return await api.put(`${ApiRoute.COSTINGS}/${id}`, data);
}

export async function createCostingRevisionApi(id: string): Promise<CostingResponse> {
  return await api.post(`${ApiRoute.COSTINGS}/${id}/revision`);
}

export interface ICopperPipeRateConfig {
  _id?: string;
  size: string;
  type: "hard" | "soft";
  rate: number;
  sleeveRate: number;
  unit: string;
  remarks?: string;
}

export async function getCopperPipeRatesApi(): Promise<{ success: boolean; data: ICopperPipeRateConfig[] }> {
  return await api.get("/copper-pipe-rates");
}

export async function syncCopperPipeRatesApi(rates: ICopperPipeRateConfig[]): Promise<{ success: boolean; data: ICopperPipeRateConfig[] }> {
  return await api.put("/copper-pipe-rates/sync", rates);
}

export async function createCopperPipeRateApi(rate: Partial<ICopperPipeRateConfig>): Promise<{ success: boolean; data: ICopperPipeRateConfig }> {
  return await api.post("/copper-pipe-rates", rate);
}

export async function updateCopperPipeRateApi(id: string, rate: Partial<ICopperPipeRateConfig>): Promise<{ success: boolean; data: ICopperPipeRateConfig }> {
  return await api.put(`/copper-pipe-rates/${id}`, rate);
}

export async function deleteCopperPipeRateApi(id: string): Promise<{ success: boolean; data: any }> {
  return await api.delete(`/copper-pipe-rates/${id}`);
}

