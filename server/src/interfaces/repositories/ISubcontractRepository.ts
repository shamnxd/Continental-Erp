import { ISubcontract } from "../models/ISubcontract";

export interface ISubcontractRepository {
  create(item: Partial<ISubcontract>): Promise<ISubcontract>;
  findById(id: string): Promise<ISubcontract | null>;
  findByProjectId(projectId: string): Promise<ISubcontract[]>;
  update(id: string, data: Partial<ISubcontract>): Promise<ISubcontract | null>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<ISubcontract[]>;
}
