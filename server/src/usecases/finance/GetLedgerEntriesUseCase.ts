import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ILedgerEntry } from "../../interfaces/models/ILedgerEntry";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";

@injectable()
export class GetLedgerEntriesUseCase implements IUseCase<void, ILedgerEntry[]> {
  constructor(
    @inject("LedgerEntryRepository")
    private _ledgerRepository: ILedgerEntryRepository
  ) {}

  public async execute(): Promise<ILedgerEntry[]> {
    return await this._ledgerRepository.findAll();
  }
}
