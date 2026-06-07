import { IBaseRepository } from "./IBaseRepository";
import { ICosting } from "../models/ICosting";

export interface ICostingRepository extends IBaseRepository<ICosting> {
  findByEnquiryId(enquiryId: string): Promise<ICosting[]>;
  findActiveByEnquiryId(enquiryId: string): Promise<ICosting | null>;
  getNextRevisionNumber(enquiryId: string): Promise<number>;
  deactivateAllForEnquiry(enquiryId: string): Promise<void>;
}
