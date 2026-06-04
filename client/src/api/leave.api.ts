import { api } from "./index";

export interface GetLeavesQuery {
  page?: number;
  limit?: number;
  status?: string;
  staffId?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffNo?: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  createdAt: string;
}

export interface GetLeavesResponse {
  success: boolean;
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getLeavesApi(query?: GetLeavesQuery): Promise<GetLeavesResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.status && query.status !== "all") params.set("status", query.status);
  if (query?.staffId) params.set("staffId", query.staffId);

  const qs = params.toString();
  const url = qs ? `/leaves?${qs}` : "/leaves";
  return await api.get(url);
}

export async function updateLeaveStatusApi(
  id: string,
  data: { status: "Pending" | "Approved" | "Rejected"; adminNote?: string }
): Promise<{ success: boolean; data: LeaveRequest }> {
  return await api.put(`/leaves/${id}/status`, data);
}
