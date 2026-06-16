import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IWarrantyRepository, GetWarrantiesQuery, PaginatedWarranties } from "../../interfaces/repositories/IWarrantyRepository";
import { IWarranty } from "../../interfaces/models/IWarranty";
import { WarrantyModel, IWarrantyDocument } from "../../models/Warranty";
import { CounterModel } from "../../models/Counter";

@injectable()
export class WarrantyRepository extends BaseRepository<IWarrantyDocument, IWarranty> implements IWarrantyRepository {
  constructor() {
    super(WarrantyModel);
  }

  protected toDomain(doc: IWarrantyDocument): IWarranty {
    const client = (doc as any).clientRef;
    const project = (doc as any).projectRef;

    let computedStatus = doc.status;
    if (computedStatus !== "Claimed") {
      const today = new Date();
      const end = new Date(doc.endDate);
      if (end < today) {
        computedStatus = "Expired";
      } else {
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          computedStatus = "Expiring Soon";
        } else {
          computedStatus = "Active";
        }
      }
    }

    return {
      id: doc._id.toString(),
      warrantyNo: doc.warrantyNo,
      clientRef: client && client._id ? {
        id: client._id.toString(),
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        city: client.city,
        address: client.address
      } as any : doc.clientRef.toString(),
      projectRef: project && project._id ? {
        id: project._id.toString(),
        projectNo: project.projectNo,
        name: project.name
      } as any : (doc.projectRef?.toString() ?? undefined),
      product: doc.product,
      startDate: doc.startDate,
      endDate: doc.endDate,
      status: computedStatus,
      remarks: doc.remarks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IWarranty>): Promise<IWarranty> {
    const year = new Date().getFullYear();
    const counterKey = `warrantyNo:${year}`;

    const latest = await this.model
      .findOne({ warrantyNo: new RegExp(`^WRN-${year}-`) })
      .sort({ warrantyNo: -1 })
      .select({ warrantyNo: 1 })
      .lean<{ warrantyNo?: string } | null>()
      .exec();

    const latestSeq = (() => {
      const no = latest?.warrantyNo;
      if (!no) return 0;
      const m = no.match(/WRN-\d{4}-(\d+)/);
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
    const warrantyNo = `WRN-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      warrantyNo,
      clientRef: new Types.ObjectId(typeof item.clientRef === "string" ? item.clientRef : item.clientRef?.id),
      projectRef: item.projectRef ? new Types.ObjectId(typeof item.projectRef === "string" ? item.projectRef : item.projectRef.id) : null
    });

    const savedDoc = await createdDoc.save();
    await savedDoc.populate(["clientRef", "projectRef"]);
    return this.toDomain(savedDoc);
  }

  public override async findById(id: string): Promise<IWarranty | null> {
    const doc = await this.model.findById(id).populate(["clientRef", "projectRef"]).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findByProjectId(projectId: string): Promise<IWarranty | null> {
    const doc = await this.model.findOne({ projectRef: new Types.ObjectId(projectId) }).populate(["clientRef", "projectRef"]).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findPaginated(query: GetWarrantiesQuery): Promise<PaginatedWarranties> {
    const { search, page = 1, limit = 10, status, clientId, projectId } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (clientId) {
      mongoFilter.clientRef = new Types.ObjectId(clientId);
    }

    if (projectId) {
      mongoFilter.projectRef = new Types.ObjectId(projectId);
    }

    if (status && status !== "all") {
      if (status === "Expired") {
        mongoFilter.$or = [
          { status: "Expired" },
          { status: { $ne: "Claimed" }, endDate: { $lt: new Date() } }
        ];
      } else if (status === "Expiring Soon") {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        mongoFilter.$or = [
          { status: "Expiring Soon" },
          { status: { $ne: "Claimed" }, endDate: { $gte: new Date(), $lte: thirtyDaysLater } }
        ];
      } else if (status === "Active") {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        mongoFilter.status = { $ne: "Claimed" };
        mongoFilter.endDate = { $gt: thirtyDaysLater };
      } else {
        mongoFilter.status = status;
      }
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { warrantyNo: regex },
        { product: regex }
      ];
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).populate(["clientRef", "projectRef"]).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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

  public override async update(id: string, item: Partial<IWarranty>): Promise<IWarranty | null> {
    const patch: Record<string, unknown> = { ...item };
    if (item.clientRef) {
      patch.clientRef = new Types.ObjectId(typeof item.clientRef === "string" ? item.clientRef : item.clientRef.id);
    }
    if (item.projectRef !== undefined) {
      patch.projectRef = item.projectRef ? new Types.ObjectId(typeof item.projectRef === "string" ? item.projectRef : item.projectRef.id) : null;
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).populate(["clientRef", "projectRef"]).exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }
}
