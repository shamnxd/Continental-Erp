import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { IAmcVisitRepository } from "../../interfaces/repositories/IAmcVisitRepository";
import { IAmcVisit } from "../../interfaces/models/IAmcVisit";
import { AmcVisitModel, IAmcVisitDocument } from "../../models/AmcVisit";

@injectable()
export class AmcVisitRepository implements IAmcVisitRepository {
  private toDomain(doc: IAmcVisitDocument): IAmcVisit {
    return {
      id: doc._id.toString(),
      amcId: doc.amcId.toString(),
      scheduledDate: doc.scheduledDate,
      status: doc.status,
      notes: doc.notes,
      assignedStaffIds: doc.assignedStaffIds?.map((id) => id.toString()) ?? [],
      smrId: doc.smrId?.toString() ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public async create(item: Partial<IAmcVisit>): Promise<IAmcVisit> {
    const doc = await AmcVisitModel.create({
      ...item,
      amcId: new Types.ObjectId(item.amcId!),
      assignedStaffIds: item.assignedStaffIds?.map((id) => new Types.ObjectId(id)) ?? [],
      smrId: item.smrId ? new Types.ObjectId(item.smrId) : null
    });
    return this.toDomain(doc);
  }

  public async findByAmcId(amcId: string): Promise<IAmcVisit[]> {
    const docs = await AmcVisitModel.find({ amcId: new Types.ObjectId(amcId) })
      .sort({ scheduledDate: 1 })
      .exec();
    return docs.map((d) => this.toDomain(d));
  }

  public async findScheduledByAmcId(amcId: string): Promise<IAmcVisit[]> {
    const docs = await AmcVisitModel.find({
      amcId: new Types.ObjectId(amcId),
      status: "Scheduled"
    })
      .sort({ scheduledDate: 1 })
      .exec();
    return docs.map((d) => this.toDomain(d));
  }

  public async findById(id: string): Promise<IAmcVisit | null> {
    const doc = await AmcVisitModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async update(id: string, data: Partial<IAmcVisit>): Promise<IAmcVisit | null> {
    const patch: Record<string, unknown> = { ...data };
    if (data.assignedStaffIds) {
      patch.assignedStaffIds = data.assignedStaffIds.map((sid) => new Types.ObjectId(sid));
    }
    if (data.smrId !== undefined) {
      patch.smrId = data.smrId ? new Types.ObjectId(data.smrId) : null;
    }
    const doc = await AmcVisitModel.findByIdAndUpdate(id, patch, { new: true }).exec();
    return doc ? this.toDomain(doc) : null;
  }
}
