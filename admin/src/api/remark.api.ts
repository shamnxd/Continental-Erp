import { api } from "./index";
import { Remark, RemarkEntityType } from "../interfaces/remark.interface";

export interface GetRemarksResponse {
  success: boolean;
  data: Remark[];
}

export interface AddRemarkResponse {
  success: boolean;
  data: Remark;
}

export async function getRemarksApi(
  entityType: RemarkEntityType,
  entityId: string,
): Promise<GetRemarksResponse> {
  return await api.get(`/remarks?entityType=${entityType}&entityId=${entityId}`);
}

export async function addRemarkApi(
  entityType: RemarkEntityType,
  entityId: string,
  text: string,
  parentRemarkId?: string | null,
  file?: File,
): Promise<AddRemarkResponse> {
  const formData = new FormData();
  formData.append("entityType", entityType);
  formData.append("entityId", entityId);
  formData.append("text", text);
  if (parentRemarkId) formData.append("parentRemarkId", parentRemarkId);
  if (file) formData.append("file", file);
  return await api.post("/remarks", formData);
}
