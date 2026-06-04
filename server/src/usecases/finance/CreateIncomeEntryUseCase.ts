import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IIncomeEntry } from "../../interfaces/models/IIncomeEntry";
import { IIncomeEntryRepository } from "../../interfaces/repositories/IIncomeEntryRepository";
import { CreateIncomeEntryDto } from "../../dtos/finance.dto";

@injectable()
export class CreateIncomeEntryUseCase implements IUseCase<CreateIncomeEntryDto, IIncomeEntry> {
  constructor(
    @inject("IncomeEntryRepository")
    private _incomeRepository: IIncomeEntryRepository
  ) {}

  public async execute(dto: CreateIncomeEntryDto): Promise<IIncomeEntry> {
    return await this._incomeRepository.create(dto);
  }
}
