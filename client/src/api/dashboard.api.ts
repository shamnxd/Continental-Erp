import { api } from "./index";

export interface DashboardResponse {
  success: boolean;
  data: {
    overview: {
      activeTasks: number;
      alertsCount: number;
      revenueThisMonth: string;
    };
    stats: Array<{
      name: string;
      value: string;
      change: string;
      icon: string;
      color: string;
    }>;
    revenueData: Array<{
      month: string;
      revenue: number;
      expenses: number;
    }>;
    complaintStatusData: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    amcVisitsData: Array<{
      month: string;
      scheduled: number;
      completed: number;
    }>;
    criticalAlerts: Array<{
      id: string;
      type: "critical" | "urgent" | "warning";
      title: string;
      client: string;
      assignee: string;
      time: string;
      priority: "Critical" | "High" | "Medium" | "Low";
      link?: string;
    }>;
    recentActivities: Array<{
      id: string;
      type: string;
      title: string;
      client: string;
      time: string;
      status: string;
    }>;
    upcomingTasks: Array<{
      id: string;
      task: string;
      client: string;
      date: string;
      assignee: string;
    }>;
  };
}

export async function getDashboardApi(query?: { allAlerts?: boolean }): Promise<DashboardResponse> {
  const qs = query?.allAlerts ? "?allAlerts=true" : "";
  return await api.get(`/dashboard${qs}`);
}
