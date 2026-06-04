import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IExpenseEntry } from "../../interfaces/models/IExpenseEntry";
import { IExpenseEntryRepository } from "../../interfaces/repositories/IExpenseEntryRepository";

@injectable()
export class GetExpenseEntriesUseCase implements IUseCase<void, IExpenseEntry[]> {
  constructor(
    @inject("ExpenseEntryRepository")
    private _expenseRepository: IExpenseEntryRepository
  ) {}

  public async execute(): Promise<IExpenseEntry[]> {
    return await this._expenseRepository.findAll();
  }
}
