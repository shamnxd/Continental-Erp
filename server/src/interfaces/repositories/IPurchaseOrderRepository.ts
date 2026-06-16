import { IPurchaseOrder } from "../models/IPurchaseOrder";

export interface IPurchaseOrderRepository {
  create(item: Partial<IPurchaseOrder>): Promise<IPurchaseOrder>;
  findById(id: string): Promise<IPurchaseOrder | null>;
  findByProjectId(projectId: string): Promise<IPurchaseOrder[]>;
  update(id: string, data: Partial<IPurchaseOrder>): Promise<IPurchaseOrder | null>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<IPurchaseOrder[]>;
}
