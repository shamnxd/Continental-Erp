import { IAmcVisit } from "../models/IAmcVisit";

export interface IAmcVisitRepository {
  create(item: Partial<IAmcVisit>): Promise<IAmcVisit>;
  findByAmcId(amcId: string): Promise<IAmcVisit[]>;
  findScheduledByAmcId(amcId: string): Promise<IAmcVisit[]>;
  findById(id: string): Promise<IAmcVisit | null>;
  update(id: string, data: Partial<IAmcVisit>): Promise<IAmcVisit | null>;
}
