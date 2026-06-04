import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IVendorBillRepository } from "../../interfaces/repositories/IVendorBillRepository";
import { IVendorBill } from "../../interfaces/models/IVendorBill";
import { VendorBillModel, IVendorBillDocument } from "../../models/VendorBill";

@injectable()
export class VendorBillRepository extends BaseRepository<IVendorBillDocument, IVendorBill> implements IVendorBillRepository {
  constructor() {
    super(VendorBillModel);
  }

  protected toDomain(doc: IVendorBillDocument): IVendorBill {
    return {
      id: doc._id.toString(),
      billNo: doc.billNo,
      vendor: doc.vendor,
      vendorGstin: doc.vendorGstin,
      vendorInvoiceNo: doc.vendorInvoiceNo,
      category: doc.category,
      billDate: doc.billDate,
      dueDate: doc.dueDate,
      paymentTerms: doc.paymentTerms,
      referenceNo: doc.referenceNo,
      items: (doc.items ?? []).map((i) => ({
        itemCode: i.itemCode,
        description: i.description,
        unit: i.unit ?? "Nos",
        qty: i.qty,
        rate: i.rate,
        discountPercent: i.discountPercent ?? 0,
        total: i.total,
        hsnSac: i.hsnSac,
      })),
      subtotal: doc.subtotal ?? doc.total ?? 0,
      gstPercent: doc.gstPercent ?? 18,
      gstAmount: doc.gstAmount ?? 0,
      total: doc.total,
      amountPaid: doc.amountPaid,
      outstanding: doc.outstanding,
      status: doc.status,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findAll(): Promise<IVendorBill[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }
}
