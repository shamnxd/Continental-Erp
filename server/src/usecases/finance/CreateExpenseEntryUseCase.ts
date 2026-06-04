import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IExpenseEntry } from "../../interfaces/models/IExpenseEntry";
import { IExpenseEntryRepository } from "../../interfaces/repositories/IExpenseEntryRepository";
import { CreateExpenseEntryDto } from "../../dtos/finance.dto";

@injectable()
export class CreateExpenseEntryUseCase implements IUseCase<CreateExpenseEntryDto, IExpenseEntry> {
  constructor(
    @inject("ExpenseEntryRepository")
    private _expenseRepository: IExpenseEntryRepository
  ) {}

  public async execute(dto: CreateExpenseEntryDto): Promise<IExpenseEntry> {
    return await this._expenseRepository.create(dto);
  }
}
