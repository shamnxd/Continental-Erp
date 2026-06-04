import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IIncomeEntryRepository } from "../../interfaces/repositories/IIncomeEntryRepository";
import { IIncomeEntry } from "../../interfaces/models/IIncomeEntry";
import { IncomeEntryModel, IIncomeEntryDocument } from "../../models/IncomeEntry";

@injectable()
export class IncomeEntryRepository extends BaseRepository<IIncomeEntryDocument, IIncomeEntry> implements IIncomeEntryRepository {
  constructor() {
    super(IncomeEntryModel);
  }

  protected toDomain(doc: IIncomeEntryDocument): IIncomeEntry {
    return {
      id: doc._id.toString(),
      source: doc.source,
      sourceType: doc.sourceType ?? "Other",
      clientId: doc.clientId,
      clientName: doc.clientName,
      incomeDate: doc.incomeDate ?? doc.createdAt?.toISOString().split("T")[0] ?? "",
      expectedDate: doc.expectedDate,
      expectedAmount: doc.expectedAmount,
      actualReceived: doc.actualReceived,
      paymentMethod: doc.paymentMethod,
      referenceNo: doc.referenceNo,
      enquiryId: doc.enquiryId,
      enquiryNo: doc.enquiryNo,
      quotationId: doc.quotationId,
      quotationNo: doc.quotationNo,
      complaintId: doc.complaintId,
      complaintNo: doc.complaintNo,
      amcId: doc.amcId,
      amcNo: doc.amcNo,
      appliedToInvoiceId: doc.appliedToInvoiceId,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findAll(): Promise<IIncomeEntry[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }
}
