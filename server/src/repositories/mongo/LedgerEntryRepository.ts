import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";
import { ILedgerEntry } from "../../interfaces/models/ILedgerEntry";
import { LedgerEntryModel, ILedgerEntryDocument } from "../../models/LedgerEntry";

@injectable()
export class LedgerEntryRepository extends BaseRepository<ILedgerEntryDocument, ILedgerEntry> implements ILedgerEntryRepository {
  constructor() {
    super(LedgerEntryModel);
  }

  protected toDomain(doc: ILedgerEntryDocument): ILedgerEntry {
    return {
      id: doc._id.toString(),
      date: doc.date,
      refType: doc.refType,
      refNo: doc.refNo,
      narration: doc.narration,
      debit: doc.debit,
      credit: doc.credit,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public async findAll(): Promise<ILedgerEntry[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map(doc => this.toDomain(doc));
  }
}
