import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ILedgerEntry } from "../../interfaces/models/ILedgerEntry";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";
import { CreateLedgerEntryDto } from "../../dtos/finance.dto";

@injectable()
export class CreateLedgerEntryUseCase implements IUseCase<CreateLedgerEntryDto, ILedgerEntry> {
  constructor(
    @inject("LedgerEntryRepository")
    private _ledgerRepository: ILedgerEntryRepository
  ) {}

  public async execute(dto: CreateLedgerEntryDto): Promise<ILedgerEntry> {
    return await this._ledgerRepository.create(dto);
  }
}
