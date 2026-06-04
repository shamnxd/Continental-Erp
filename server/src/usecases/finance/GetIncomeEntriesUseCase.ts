import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IIncomeEntry } from "../../interfaces/models/IIncomeEntry";
import { IIncomeEntryRepository } from "../../interfaces/repositories/IIncomeEntryRepository";

@injectable()
export class GetIncomeEntriesUseCase implements IUseCase<void, IIncomeEntry[]> {
  constructor(
    @inject("IncomeEntryRepository")
    private _incomeRepository: IIncomeEntryRepository
  ) {}

  public async execute(): Promise<IIncomeEntry[]> {
    return await this._incomeRepository.findAll();
  }
}
