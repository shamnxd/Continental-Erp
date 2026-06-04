import { IBaseRepository } from "./IBaseRepository";
import { ILedgerEntry } from "../models/ILedgerEntry";

export interface ILedgerEntryRepository extends IBaseRepository<ILedgerEntry> {
  findAll(): Promise<ILedgerEntry[]>;
}
