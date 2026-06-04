import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IExpenseEntryRepository } from "../../interfaces/repositories/IExpenseEntryRepository";
import { IExpenseEntry } from "../../interfaces/models/IExpenseEntry";
import { ExpenseEntryModel, IExpenseEntryDocument } from "../../models/ExpenseEntry";

@injectable()
export class ExpenseEntryRepository extends BaseRepository<IExpenseEntryDocument, IExpenseEntry> implements IExpenseEntryRepository {
  constructor() {
    super(ExpenseEntryModel);
  }

  protected toDomain(doc: IExpenseEntryDocument): IExpenseEntry {
    return {
      id: doc._id.toString(),
      category: doc.category,
      name: doc.name,
      description: doc.description,
      payee: doc.payee,
      expenseDate: doc.expenseDate ?? doc.createdAt?.toISOString().split("T")[0] ?? "",
      periodMonth: doc.periodMonth ?? "",
      paymentMethod: doc.paymentMethod,
      referenceNo: doc.referenceNo,
      budget: doc.budget,
      actual: doc.actual,
      status: doc.status ?? "Recorded",
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findAll(): Promise<IExpenseEntry[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }
}
