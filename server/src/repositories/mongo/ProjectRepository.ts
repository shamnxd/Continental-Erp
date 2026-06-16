import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IProjectRepository, GetProjectsQuery, PaginatedProjects } from "../../interfaces/repositories/IProjectRepository";
import { IProject } from "../../interfaces/models/IProject";
import { ProjectModel, IProjectDocument } from "../../models/Project";
import { CounterModel } from "../../models/Counter";
import { WarrantyModel } from "../../models/Warranty";

@injectable()
export class ProjectRepository extends BaseRepository<IProjectDocument, IProject> implements IProjectRepository {
  constructor() {
    super(ProjectModel);
  }

  protected toDomain(doc: IProjectDocument): IProject {
    const client = (doc as any).clientRef;
    return {
      id: doc._id.toString(),
      projectNo: doc.projectNo,
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
      name: doc.name,
      startDate: doc.startDate,
      status: doc.status,
      value: doc.value,
      quotationRef: doc.quotationRef?.toString() ?? undefined,
      expectedCompletionDate: doc.expectedCompletionDate,
      actualCompletionDate: doc.actualCompletionDate,
      handoverDocs: (doc.handoverDocs ?? []).map((d) => ({
        name: d.name,
        url: d.url,
        storageKey: d.storageKey,
        uploadedBy: d.uploadedBy,
        uploadedDate: d.uploadedDate
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IProject>): Promise<IProject> {
    const year = new Date().getFullYear();
    const counterKey = `projectNo:${year}`;

    // Initialize counter based on existing max, only once per year key.
    const latest = await this.model
      .findOne({ projectNo: new RegExp(`^PRJ-${year}-`) })
      .sort({ projectNo: -1 })
      .select({ projectNo: 1 })
      .lean<{ projectNo?: string } | null>()
      .exec();
    const latestSeq = (() => {
      const no = latest?.projectNo;
      if (!no) return 0;
      const m = no.match(/PRJ-\d{4}-(\d+)/);
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
    const projectNo = `PRJ-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      projectNo,
      clientRef: new Types.ObjectId(typeof item.clientRef === "string" ? item.clientRef : item.clientRef?.id)
    });
    const savedDoc = await createdDoc.save();
    await savedDoc.populate("clientRef");
    return this.toDomain(savedDoc);
  }

  public override async findById(id: string): Promise<IProject | null> {
    const doc = await this.model.findById(id).populate("clientRef").exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findPaginated(query: GetProjectsQuery): Promise<PaginatedProjects> {
    const { search, page = 1, limit = 10, status, clientId } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (clientId) {
      mongoFilter.clientRef = new Types.ObjectId(clientId);
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { projectNo: regex },
        { name: regex }
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

  public override async update(id: string, item: Partial<IProject>): Promise<IProject | null> {
    const patch: Record<string, unknown> = { ...item };
    if (item.clientRef) {
      patch.clientRef = new Types.ObjectId(typeof item.clientRef === "string" ? item.clientRef : item.clientRef.id);
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).populate("clientRef").exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }

  public async countActiveByClientId(clientId: string): Promise<number> {
    return this.model
      .countDocuments({
        clientRef: new Types.ObjectId(clientId),
        status: { $in: ["Planning", "Active", "On Hold"] }
      })
      .exec();
  }

  public async findCompletedWithoutWarranty(): Promise<IProject[]> {
    const warranties = await WarrantyModel.find({ projectRef: { $ne: null } }).select("projectRef").exec();
    const projectIdsWithWarranty = warranties.filter(w => w.projectRef).map(w => w.projectRef!.toString());

    const docs = await this.model.find({
      status: "Completed",
      _id: { $nin: projectIdsWithWarranty }
    }).populate("clientRef").sort({ updatedAt: -1 }).exec();

    return docs.map(doc => this.toDomain(doc));
  }
}
