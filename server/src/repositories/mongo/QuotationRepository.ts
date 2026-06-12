import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import {
  IQuotationRepository,
  GetQuotationsQuery,
  PaginatedQuotations,
} from "../../interfaces/repositories/IQuotationRepository";
import { IQuotation } from "../../interfaces/models/IQuotation";
import { QuotationModel, IQuotationDocument } from "../../models/Quotation";

@injectable()
export class QuotationRepository
  extends BaseRepository<IQuotationDocument, IQuotation>
  implements IQuotationRepository
{
  constructor() {
    super(QuotationModel);
  }

  protected toDomain(doc: IQuotationDocument): IQuotation {
    const client = (doc as unknown as { clientRef?: any }).clientRef;
    const clientName = client?.companyName ?? doc.clientName;

    return {
      id: doc._id.toString(),
      quotationNo: doc.quotationNo,
      date: doc.date,
      validUntil: doc.validUntil,
      clientId: doc.clientId,
      clientName,
      enquiryId: doc.enquiryId || undefined,
      enquiryNo: doc.enquiryNo || undefined,
      amount: doc.amount,
      gstPercent: doc.gstPercent,
      gst: doc.gst,
      total: doc.total,
      status: doc.status,
      items: (doc.items ?? []).map((i) => ({
        description: i.description,
        qty: i.qty,
        rate: i.rate,
        total: i.total,
        section: i.section,
        unit: i.unit,
      })),
      remarks: (doc.remarks ?? []).map((r) => ({
        id: (r as { _id?: { toString(): string } })._id?.toString(),
        user: r.user,
        date: r.date,
        text: r.text,
      })),
      notes: doc.notes ?? "",
      revision: doc.revision,
      isActive: doc.isActive,
      costingId: doc.costingId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public override async create(item: Partial<IQuotation>): Promise<IQuotation> {
    let quotationNo = item.quotationNo;
    if (!quotationNo) {
      const year = new Date().getFullYear();
      const count = await this.model.countDocuments().exec();
      const pad = String(count + 1).padStart(3, "0");
      quotationNo = `QUO-${year}-${pad}`;
    }

    const createdDoc = new this.model({
      ...item,
      quotationNo,
      clientRef: item.clientId && Types.ObjectId.isValid(item.clientId) ? new Types.ObjectId(item.clientId) : null,
    });

    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async findById(id: string): Promise<IQuotation | null> {
    const doc = await this.model.findById(id).populate("clientRef").exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findPaginated(query: GetQuotationsQuery): Promise<PaginatedQuotations> {
    const { search, page = 1, limit = 10, status, clientId, enquiryId, quotationNo } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (quotationNo) {
      mongoFilter.quotationNo = quotationNo;
    } else {
      mongoFilter.isActive = true;
    }

    if (clientId) mongoFilter.clientId = clientId;
    if (enquiryId) mongoFilter.enquiryId = enquiryId;

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { quotationNo: regex },
        { clientName: regex },
        { enquiryNo: regex },
      ];
    }

    if (status && status !== "all") {
      mongoFilter.status = status;
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).populate("clientRef").sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getNextRevisionNumber(quotationNo: string): Promise<number> {
    const latest = await this.model.findOne({ quotationNo }).sort({ revision: -1 }).exec();
    return latest ? latest.revision + 1 : 0;
  }

  public async deactivateAllForNo(quotationNo: string): Promise<void> {
    await this.model.updateMany({ quotationNo }, { isActive: false }).exec();
  }
}
