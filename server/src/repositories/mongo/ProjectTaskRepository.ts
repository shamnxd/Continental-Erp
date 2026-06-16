import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IProjectTaskRepository } from "../../interfaces/repositories/IProjectTaskRepository";
import { IProjectTask } from "../../interfaces/models/IProjectTask";
import { ProjectTaskModel, IProjectTaskDocument } from "../../models/ProjectTask";

@injectable()
export class ProjectTaskRepository extends BaseRepository<IProjectTaskDocument, IProjectTask> implements IProjectTaskRepository {
  constructor() {
    super(ProjectTaskModel);
  }

  protected toDomain(doc: IProjectTaskDocument): IProjectTask {
    return {
      id: doc._id.toString(),
      projectRef: doc.projectRef.toString(),
      title: doc.title,
      description: doc.description,
      status: doc.status,
      priority: doc.priority,
      assignedStaffId: doc.assignedStaffId?.toString() ?? undefined,
      assignedTo: doc.assignedTo,
      dueDate: doc.dueDate ?? undefined,
      completedWorkNotes: doc.completedWorkNotes ?? "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public async findByProjectId(projectId: string): Promise<IProjectTask[]> {
    const docs = await this.model
      .find({ projectRef: new Types.ObjectId(projectId) })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map(doc => this.toDomain(doc));
  }

  public override async create(item: Partial<IProjectTask>): Promise<IProjectTask> {
    const createdDoc = new this.model({
      ...item,
      projectRef: new Types.ObjectId(item.projectRef),
      assignedStaffId: item.assignedStaffId ? new Types.ObjectId(item.assignedStaffId) : undefined
    });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async update(id: string, item: Partial<IProjectTask>): Promise<IProjectTask | null> {
    const patch: any = { ...item };
    if (item.projectRef) {
      patch.projectRef = new Types.ObjectId(item.projectRef);
    }
    if (item.assignedStaffId) {
      patch.assignedStaffId = new Types.ObjectId(item.assignedStaffId);
    } else if (item.hasOwnProperty("assignedStaffId")) {
      patch.assignedStaffId = null;
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }
}
