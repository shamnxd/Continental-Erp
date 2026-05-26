import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IAmcRepository, GetAmcQuery, PaginatedAmc } from "../../interfaces/repositories/IAmcRepository";
import { IAmc } from "../../interfaces/models/IAmc";
import { AmcModel, IAmcDocument } from "../../models/Amc";

@injectable()
export class AmcRepository extends BaseRepository<IAmcDocument, IAmc> implements IAmcRepository {
  constructor() {
    super(AmcModel);
  }

  protected toDomain(doc: IAmcDocument): IAmc {
    return {
      id: doc._id.toString(),
      amcNo: doc.amcNo,
      clientId: doc.clientId.toString(),
      clientName: doc.clientName,
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
      remarks: doc.remarks ?? [],
      advancePaid: doc.advancePaid ?? 0,
      payments: doc.payments ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IAmc>): Promise<IAmc> {
    const year = new Date().getFullYear();
    const count = await this.model.countDocuments().exec();
    const pad = String(count + 1).padStart(3, "0");
    const amcNo = `AMC-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      amcNo,
      clientId: new Types.ObjectId(item.clientId!)
    });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
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
      this.model.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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
