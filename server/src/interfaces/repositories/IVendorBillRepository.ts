import { IBaseRepository } from "./IBaseRepository";
import { IVendorBill } from "../models/IVendorBill";

export interface IVendorBillRepository extends IBaseRepository<IVendorBill> {
  findAll(): Promise<IVendorBill[]>;
}
