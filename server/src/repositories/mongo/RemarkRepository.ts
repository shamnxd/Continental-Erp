import { IRemark, RemarkEntityType } from "../../interfaces/models/IRemark";
import { IRemarkRepository } from "../../interfaces/repositories/IRemarkRepository";
import { RemarkModel, IRemarkDocument } from "../../models/Remark";
import { injectable } from "tsyringe";

@injectable()
export class RemarkRepository implements IRemarkRepository {
  private toDomain(doc: IRemarkDocument): IRemark {
    return {
      id: doc._id.toString(),
      entityType: doc.entityType,
      entityId: doc.entityId,
      user: doc.user,
      text: doc.text,
      attachments: (doc.attachments ?? []).map((a) => ({
        name: a.name,
        url: a.url,
        mimeType: a.mimeType,
        size: a.size,
      })),
      parentRemarkId: doc.parentRemarkId ?? null,
      date: doc.date,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findByEntity(entityType: RemarkEntityType, entityId: string): Promise<IRemark[]> {
    const docs = await RemarkModel.find({ entityType, entityId })
      .sort({ date: 1 })
      .exec();
    return docs.map((d) => this.toDomain(d));
  }

  public async create(item: Partial<IRemark>): Promise<IRemark> {
    const doc = new RemarkModel(item);
    const saved = await doc.save();
    return this.toDomain(saved);
  }
}
