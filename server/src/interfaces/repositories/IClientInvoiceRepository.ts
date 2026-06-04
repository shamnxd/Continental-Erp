import { IBaseRepository } from "./IBaseRepository";
import { IClientInvoice } from "../models/IClientInvoice";

export interface IClientInvoiceRepository extends IBaseRepository<IClientInvoice> {
  findAll(): Promise<IClientInvoice[]>;
}
