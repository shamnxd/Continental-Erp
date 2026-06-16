import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { ISubcontractRepository } from "../../interfaces/repositories/ISubcontractRepository";
import { ISubcontract } from "../../interfaces/models/ISubcontract";
import { SubcontractModel, ISubcontractDocument } from "../../models/Subcontract";

@injectable()
export class SubcontractRepository extends BaseRepository<ISubcontractDocument, ISubcontract> implements ISubcontractRepository {
  constructor() {
    super(SubcontractModel);
  }

  protected toDomain(doc: ISubcontractDocument): ISubcontract {
    return {
      id: doc._id.toString(),
      projectRef: doc.projectRef.toString(),
      contractorName: doc.contractorName,
      scopeOfWork: doc.scopeOfWork,
      value: doc.value,
      status: doc.status,
      completionReportUrl: doc.completionReportUrl ?? "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public async findByProjectId(projectId: string): Promise<ISubcontract[]> {
    const docs = await this.model
      .find({ projectRef: new Types.ObjectId(projectId) })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map(doc => this.toDomain(doc));
  }

  public override async create(item: Partial<ISubcontract>): Promise<ISubcontract> {
    const createdDoc = new this.model({
      ...item,
      projectRef: new Types.ObjectId(item.projectRef)
    });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async update(id: string, item: Partial<ISubcontract>): Promise<ISubcontract | null> {
    const patch: any = { ...item };
    if (item.projectRef) {
      patch.projectRef = new Types.ObjectId(item.projectRef);
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }
}
