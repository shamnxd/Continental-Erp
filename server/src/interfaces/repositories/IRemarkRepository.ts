import { IRemark, RemarkEntityType } from "../models/IRemark";

export interface IRemarkRepository {
  findByEntity(entityType: RemarkEntityType, entityId: string): Promise<IRemark[]>;
  create(item: Partial<IRemark>): Promise<IRemark>;
}
