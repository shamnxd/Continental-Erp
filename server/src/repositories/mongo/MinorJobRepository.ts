import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IMinorJobRepository, GetMinorJobsQuery, PaginatedMinorJobs } from "../../interfaces/repositories/IMinorJobRepository";
import { IMinorJob } from "../../interfaces/models/IMinorJob";
import { MinorJobModel, IMinorJobDocument } from "../../models/MinorJob";
import { CounterModel } from "../../models/Counter";

@injectable()
export class MinorJobRepository extends BaseRepository<IMinorJobDocument, IMinorJob> implements IMinorJobRepository {
  constructor() {
    super(MinorJobModel);
  }

  protected toDomain(doc: IMinorJobDocument): IMinorJob {
    const client = (doc as any).clientRef;
    return {
      id: doc._id.toString(),
      jobNo: doc.jobNo,
      clientRef: client && client._id ? {
        id: client._id.toString(),
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        city: client.city,
        address: client.address,
        projectsCount: client.projectsCount,
        amcStatus: client.amcStatus
      } : doc.clientRef.toString(),
      description: doc.description,
      scheduledDate: doc.scheduledDate,
      status: doc.status,
      assignedTo: doc.assignedTo,
      assignedStaffId: doc.assignedStaffId || undefined,
      quotationRef: doc.quotationRef?.toString() ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IMinorJob>): Promise<IMinorJob> {
    const year = new Date().getFullYear();
    const counterKey = `minorJobNo:${year}`;

    // Initialize counter based on existing max, only once per year key.
    const latest = await this.model
      .findOne({ jobNo: new RegExp(`^MJ-${year}-`) })
      .sort({ jobNo: -1 })
      .select({ jobNo: 1 })
      .lean<{ jobNo?: string } | null>()
      .exec();
    const latestSeq = (() => {
      const no = latest?.jobNo;
      if (!no) return 0;
      const m = no.match(/MJ-\d{4}-(\d+)/);
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
    const jobNo = `MJ-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      jobNo,
      clientRef: new Types.ObjectId(typeof item.clientRef === "string" ? item.clientRef : item.clientRef?.id)
    });
    const savedDoc = await createdDoc.save();
    await savedDoc.populate("clientRef");
    return this.toDomain(savedDoc);
  }

  public override async findById(id: string): Promise<IMinorJob | null> {
    const doc = await this.model.findById(id).populate("clientRef").exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findPaginated(query: GetMinorJobsQuery): Promise<PaginatedMinorJobs> {
    const { search, page = 1, limit = 10, status, clientId } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (clientId) {
      mongoFilter.clientRef = new Types.ObjectId(clientId);
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { jobNo: regex },
        { description: regex },
        { assignedTo: regex }
      ];
    }

    if (status && status !== "all") {
      mongoFilter.status = status;
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).populate("clientRef").sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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

  public override async update(id: string, item: Partial<IMinorJob>): Promise<IMinorJob | null> {
    const patch: Record<string, unknown> = { ...item };
    if (item.clientRef) {
      patch.clientRef = new Types.ObjectId(typeof item.clientRef === "string" ? item.clientRef : item.clientRef.id);
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).populate("clientRef").exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }
}
