import { IBaseRepository } from "./IBaseRepository";
import { IExpenseEntry } from "../models/IExpenseEntry";

export interface IExpenseEntryRepository extends IBaseRepository<IExpenseEntry> {
  findAll(): Promise<IExpenseEntry[]>;
}
