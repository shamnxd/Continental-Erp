import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import {
  IScheduleRepository,
  GetSchedulesQuery,
  PaginatedSchedules,
} from "../../interfaces/repositories/IScheduleRepository";
import { ISchedule } from "../../interfaces/models/ISchedule";
import { ScheduleModel, IScheduleDocument } from "../../models/Schedule";

@injectable()
export class ScheduleRepository
  extends BaseRepository<IScheduleDocument, ISchedule>
  implements IScheduleRepository
{
  constructor() {
    super(ScheduleModel);
  }

  protected toDomain(doc: IScheduleDocument): ISchedule {
    const client = doc.clientRef as any;
    const clientLogoUrl = client && typeof client === "object" && "logoUrl" in client ? client.logoUrl : "";
    const clientRefStr = client && typeof client === "object" && "_id" in client ? client._id.toString() : (doc.clientRef?.toString() || null);
    const clientName = client && typeof client === "object" && "companyName" in client ? client.companyName : doc.clientName;
    return {
      id: doc._id.toString(),
      entityType: doc.entityType,
      entityId: doc.entityId,
      entityNo: doc.entityNo,
      clientName,
      clientLogoUrl,
      clientRef: clientRefStr,
      title: doc.title,
      scheduleType: doc.scheduleType,
      scheduledDate: doc.scheduledDate,
      status: doc.status,
      assignedStaffIds: doc.assignedStaffIds || [],
      assignedTo: doc.assignedTo || [],
      notes: doc.notes || "",
      smrId: doc.smrId?.toString() || null,
      completedAt: doc.completedAt || null,
      completionNotes: (doc as any).completionNotes || "",
      completionAttachments: ((doc as any).completionAttachments || []).map((att: any) => ({
        name: att.name,
        url: att.url,
        mimeType: att.mimeType,
        size: att.size,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findByEntity(entityType: string, entityId: string): Promise<ISchedule[]> {
    const docs = await this.model
      .find({ entityType, entityId })
      .populate("clientRef")
      .sort({ scheduledDate: 1 })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  public async findPaginated(query: GetSchedulesQuery): Promise<PaginatedSchedules> {
    const { entityType, entityId, startDate, endDate, search, page = 1, limit = 10 } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (entityType) {
      mongoFilter.entityType = entityType;
    }
    if (entityId) {
      mongoFilter.entityId = entityId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }
      mongoFilter.scheduledDate = dateFilter;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { entityNo: regex },
        { clientName: regex },
        { title: regex },
        { notes: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(mongoFilter)
        .populate("clientRef")
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
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

  public override async create(item: Partial<ISchedule>): Promise<ISchedule> {
    const createdDoc = new this.model({
      ...item,
      clientRef:
        item.clientRef && Types.ObjectId.isValid(item.clientRef)
          ? new Types.ObjectId(item.clientRef)
          : null,
      smrId:
        item.smrId && Types.ObjectId.isValid(item.smrId)
          ? new Types.ObjectId(item.smrId)
          : null,
    });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async update(id: string, item: Partial<ISchedule>): Promise<ISchedule | null> {
    const patch = { ...item } as Record<string, any>;
    if (item.clientRef !== undefined) {
      patch.clientRef =
        item.clientRef && Types.ObjectId.isValid(item.clientRef)
          ? new Types.ObjectId(item.clientRef)
          : null;
    }
    if (item.smrId !== undefined) {
      patch.smrId =
        item.smrId && Types.ObjectId.isValid(item.smrId)
          ? new Types.ObjectId(item.smrId)
          : null;
    }

    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    return doc ? this.toDomain(doc) : null;
  }
}
