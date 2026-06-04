import { IBaseRepository } from "./IBaseRepository";
import { IIncomeEntry } from "../models/IIncomeEntry";

export interface IIncomeEntryRepository extends IBaseRepository<IIncomeEntry> {
  findAll(): Promise<IIncomeEntry[]>;
}
