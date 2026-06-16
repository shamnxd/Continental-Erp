import { IProjectTask } from "../models/IProjectTask";

export interface IProjectTaskRepository {
  create(item: Partial<IProjectTask>): Promise<IProjectTask>;
  findById(id: string): Promise<IProjectTask | null>;
  findByProjectId(projectId: string): Promise<IProjectTask[]>;
  update(id: string, data: Partial<IProjectTask>): Promise<IProjectTask | null>;
  delete(id: string): Promise<boolean>;
}
