import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IPurchaseOrderRepository } from "../../interfaces/repositories/IPurchaseOrderRepository";
import { IPurchaseOrder } from "../../interfaces/models/IPurchaseOrder";
import { PurchaseOrderModel, IPurchaseOrderDocument } from "../../models/PurchaseOrder";
import { CounterModel } from "../../models/Counter";

@injectable()
export class PurchaseOrderRepository extends BaseRepository<IPurchaseOrderDocument, IPurchaseOrder> implements IPurchaseOrderRepository {
  constructor() {
    super(PurchaseOrderModel);
  }

  protected toDomain(doc: IPurchaseOrderDocument): IPurchaseOrder {
    return {
      id: doc._id.toString(),
      projectRef: doc.projectRef.toString(),
      poNo: doc.poNo,
      vendorName: doc.vendorName,
      amount: doc.amount,
      status: doc.status,
      items: (doc.items ?? []).map((i) => ({
        description: i.description,
        qty: i.qty,
        rate: i.rate,
        total: i.total
      })),
      pdfUrl: doc.pdfUrl,
      pdfStorageKey: doc.pdfStorageKey,
      pdfDocs: (doc.pdfDocs ?? []).map((d: any) => ({
        name: d.name,
        url: d.url,
        storageKey: d.storageKey,
        uploadedBy: d.uploadedBy,
        uploadedDate: d.uploadedDate
      })),
      revision: doc.revision ?? 0,
      revisions: (doc.revisions ?? []).map((r: any) => ({
        revisionNo: r.revisionNo,
        vendorName: r.vendorName,
        amount: r.amount,
        items: (r.items ?? []).map((i: any) => ({
          description: i.description,
          qty: i.qty,
          rate: i.rate,
          total: i.total
        })),
        pdfUrl: r.pdfUrl,
        pdfStorageKey: r.pdfStorageKey,
        updatedBy: r.updatedBy,
        updatedAt: r.updatedAt
      })),
      activityLog: (doc.activityLog ?? []).map((a: any) => ({
        message: a.message,
        user: a.user,
        date: a.date
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public async findByProjectId(projectId: string): Promise<IPurchaseOrder[]> {
    const docs = await this.model
      .find({ projectRef: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(doc => this.toDomain(doc));
  }

  public override async create(item: Partial<IPurchaseOrder>): Promise<IPurchaseOrder> {
    const year = new Date().getFullYear();
    const counterKey = `poNo:${year}`;

    const latest = await this.model
      .findOne({ poNo: new RegExp(`^PO-${year}-`) })
      .sort({ poNo: -1 })
      .select({ poNo: 1 })
      .lean<{ poNo?: string } | null>()
      .exec();
    const latestSeq = (() => {
      const no = latest?.poNo;
      if (!no) return 0;
      const m = no.match(/PO-\d{4}-(\d+)/);
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
    const poNo = `PO-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      poNo,
      projectRef: new Types.ObjectId(item.projectRef)
    });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async update(id: string, item: Partial<IPurchaseOrder>): Promise<IPurchaseOrder | null> {
    const patch: any = { ...item };
    if (item.projectRef) {
      patch.projectRef = new Types.ObjectId(item.projectRef);
    }
    const updatedDoc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }
}
