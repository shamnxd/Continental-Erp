import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IAmcRepository, GetAmcQuery, PaginatedAmc } from "../../interfaces/repositories/IAmcRepository";
import { IAmc } from "../../interfaces/models/IAmc";
import { AmcModel, IAmcDocument } from "../../models/Amc";
import { CounterModel } from "../../models/Counter";

@injectable()
export class AmcRepository extends BaseRepository<IAmcDocument, IAmc> implements IAmcRepository {
  constructor() {
    super(AmcModel);
  }

  protected toDomain(doc: IAmcDocument): IAmc {
    const client = doc.clientId as any;
    const clientLogoUrl = client && typeof client === "object" && "logoUrl" in client ? client.logoUrl : "";
    const clientIdStr = client && typeof client === "object" && "_id" in client ? client._id.toString() : doc.clientId.toString();
    const clientName = client && typeof client === "object" && "companyName" in client ? client.companyName : doc.clientName;
    return {
      id: doc._id.toString(),
      amcNo: doc.amcNo,
      clientId: clientIdStr,
      clientName,
      clientLogoUrl,
      contactPerson: doc.contactPerson,
      phone: doc.phone,
      email: doc.email,
      location: doc.location,
      startDate: doc.startDate,
      endDate: doc.endDate,
      frequency: doc.frequency,
      nextVisit: doc.nextVisit ?? null,
      status: doc.status,
      amount: doc.amount,
      visitsCompleted: doc.visitsCompleted,
      totalVisits: doc.totalVisits,
      serviceType: doc.serviceType,
      notes: doc.notes,
      remarks: (doc.remarks ?? []).map((r: { _id?: { toString(): string }; user: string; date: Date; text: string }) => ({
        id: r._id?.toString(),
        user: r.user,
        date: r.date,
        text: r.text,
      })),
      advancePaid: doc.advancePaid ?? 0,
      payments: doc.payments ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IAmc>): Promise<IAmc> {
    const year = new Date().getFullYear();
    const counterKey = `amcNo:${year}`;

    // Initialize counter based on existing max, only once per year key.
    const latest = await this.model
      .findOne({ amcNo: new RegExp(`^AMC-${year}-`) })
      .sort({ amcNo: -1 })
      .select({ amcNo: 1 })
      .lean<{ amcNo?: string } | null>()
      .exec();
    const latestSeq = (() => {
      const no = latest?.amcNo;
      if (!no) return 0;
      const m = no.match(/AMC-\d{4}-(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return Number.isFinite(n) ? n : 0;
    })();

    await CounterModel.updateOne(
      { key: counterKey },
      { $setOnInsert: { key: counterKey, seq: latestSeq } },
      { upsert: true }
    ).exec();

    const counter = await CounterModel.findOneAndUpdate(
      { key: counterKey },
      { $inc: { seq: 1 } },
      { new: true }
    )
      .lean<{ seq: number }>()
      .exec();

    const seq = counter?.seq ?? latestSeq + 1;
    const pad = String(seq).padStart(3, "0");
    const amcNo = `AMC-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      amcNo,
      clientId: new Types.ObjectId(item.clientId!)
    });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async findById(id: string): Promise<IAmc | null> {
    const doc = await this.model.findById(id).populate("clientId").exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findPaginated(query: GetAmcQuery): Promise<PaginatedAmc> {
    const { search, page = 1, limit = 10, status, clientId } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (clientId) {
      mongoFilter.clientId = new Types.ObjectId(clientId);
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { amcNo: regex },
        { clientName: regex },
        { contactPerson: regex },
        { phone: regex },
        { email: regex },
        { location: regex },
        { serviceType: regex }
      ];
    }

    if (status && status !== "all") {
      mongoFilter.status = status;
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).populate("clientId").sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec()
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  public override async update(id: string, item: Partial<IAmc>): Promise<IAmc | null> {
    const patch: Record<string, unknown> = { ...item };
    if (item.clientId) {
      patch.clientId = new Types.ObjectId(item.clientId);
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }

  public async countActiveByClientId(clientId: string): Promise<number> {
    return this.model
      .countDocuments({
        clientId: new Types.ObjectId(clientId),
        status: { $in: ["Active", "Due for Renewal"] }
      })
      .exec();
  }
}
