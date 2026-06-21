import { api } from "./index";
import { ProjectTask } from "../interfaces/projectTask.interface";
import { ApiRoute } from "../constants/routes.enum";

export interface ProjectTasksResponse {
  success: boolean;
  data: ProjectTask[];
}

export interface ProjectTaskResponse {
  success: boolean;
  data: ProjectTask;
}

export async function getProjectTasksApi(projectId: string): Promise<ProjectTasksResponse> {
  return await api.get(`${ApiRoute.PROJECTS}/${projectId}/tasks`);
}

export async function createProjectTaskApi(
  projectId: string,
  data: Partial<ProjectTask>
): Promise<ProjectTaskResponse> {
  return await api.post(`${ApiRoute.PROJECTS}/${projectId}/tasks`, data);
}

export async function updateProjectTaskApi(
  projectId: string,
  taskId: string,
  data: Partial<ProjectTask>
): Promise<ProjectTaskResponse> {
  return await api.put(`${ApiRoute.PROJECTS}/${projectId}/tasks/${taskId}`, data);
}

export async function deleteProjectTaskApi(
  projectId: string,
  taskId: string
): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${ApiRoute.PROJECTS}/${projectId}/tasks/${taskId}`);
}
