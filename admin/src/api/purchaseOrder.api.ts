import { api } from "./index";
import { PurchaseOrder } from "../interfaces/purchaseOrder.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface PurchaseOrdersResponse {
  success: boolean;
  data: PurchaseOrder[];
}

export interface PurchaseOrderResponse {
  success: boolean;
  data: PurchaseOrder;
}

export async function getPurchaseOrdersApi(projectId: string): Promise<PurchaseOrdersResponse> {
  return await api.get(`${ApiRoute.PROJECTS}/${projectId}/purchase-orders`);
}

export async function getAllPurchaseOrdersApi(): Promise<PurchaseOrdersResponse> {
  return await api.get(`${ApiRoute.PROJECTS}/all-purchase-orders`);
}

export async function createPurchaseOrderApi(
  projectId: string,
  data: Partial<PurchaseOrder>
): Promise<PurchaseOrderResponse> {
  return await api.post(`${ApiRoute.PROJECTS}/${projectId}/purchase-orders`, data);
}

export async function updatePurchaseOrderApi(
  projectId: string,
  poId: string,
  data: Partial<PurchaseOrder>
): Promise<PurchaseOrderResponse> {
  return await api.put(`${ApiRoute.PROJECTS}/${projectId}/purchase-orders/${poId}`, data);
}

export async function deletePurchaseOrderApi(
  projectId: string,
  poId: string
): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.PROJECTS}/${projectId}/purchase-orders/${poId}`);
}

export async function uploadPurchaseOrderPdfApi(
  projectId: string,
  poId: string,
  file: File
): Promise<PurchaseOrderResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return await api.post(`${ApiRoute.PROJECTS}/${projectId}/purchase-orders/${poId}/pdf`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

