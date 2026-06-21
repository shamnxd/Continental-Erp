import { api } from "./index";

export interface GetKanbanQuery {
  search?: string;
  type?: string;
  priority?: string;
  stage?: string;
  page?: number;
  limit?: number;
}

export interface GetKanbanResponse {
  success: boolean;
  data: any;
  hasMore?: boolean;
  total?: number;
  counts?: Record<string, number>;
}

export async function getKanbanApi(query?: GetKanbanQuery): Promise<GetKanbanResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.type) params.set("type", query.type);
  if (query?.priority) params.set("priority", query.priority);
  if (query?.stage) params.set("stage", query.stage);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  const url = qs ? `/kanban?${qs}` : "/kanban";
  return await api.get(url);
}
