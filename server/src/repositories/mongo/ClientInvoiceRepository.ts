import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IClientInvoiceRepository } from "../../interfaces/repositories/IClientInvoiceRepository";
import { IClientInvoice } from "../../interfaces/models/IClientInvoice";
import { ClientInvoiceModel, IClientInvoiceDocument } from "../../models/ClientInvoice";

@injectable()
export class ClientInvoiceRepository extends BaseRepository<IClientInvoiceDocument, IClientInvoice> implements IClientInvoiceRepository {
  constructor() {
    super(ClientInvoiceModel);
  }

  protected toDomain(doc: IClientInvoiceDocument): IClientInvoice {
    const mapItem = (i: IClientInvoiceDocument["items"][number]) => ({
      description: i.description,
      itemCode: i.itemCode,
      unit: i.unit ?? "Nos",
      qty: i.qty,
      rate: i.rate,
      discountPercent: i.discountPercent ?? 0,
      total: i.total,
      hsnSac: i.hsnSac,
    });

    return {
      id: doc._id.toString(),
      invoiceNo: doc.invoiceNo,
      invoiceType: doc.invoiceType,
      documentStatus: doc.documentStatus ?? "Draft",
      companyName: doc.companyName ?? "Continental",
      currency: doc.currency ?? "INR",
      clientId: doc.clientId,
      clientName: doc.clientName,
      contactPerson: doc.contactPerson,
      clientEmail: doc.clientEmail,
      clientPhone: doc.clientPhone,
      clientGstin: doc.clientGstin,
      billingAddress: doc.billingAddress,
      siteAddress: doc.siteAddress,
      placeOfSupply: doc.placeOfSupply,
      enquiryId: doc.enquiryId,
      enquiryNo: doc.enquiryNo,
      quotationId: doc.quotationId,
      quotationNo: doc.quotationNo,
      complaintId: doc.complaintId,
      complaintNo: doc.complaintNo,
      amcId: doc.amcId,
      amcNo: doc.amcNo,
      smrId: doc.smrId,
      smrNo: doc.smrNo,
      jobCardNo: doc.jobCardNo,
      workOrderNo: doc.workOrderNo,
      issueDate: doc.issueDate,
      dueDate: doc.dueDate,
      paymentTerms: doc.paymentTerms,
      items: (doc.items ?? []).map(mapItem),
      subtotal: doc.subtotal ?? 0,
      headerDiscount: doc.headerDiscount ?? 0,
      taxableAmount: doc.taxableAmount ?? doc.subtotal ?? doc.grandTotal ?? 0,
      gstPercent: doc.gstPercent ?? 18,
      supplyType: doc.supplyType ?? "intra",
      cgstPercent: doc.cgstPercent,
      sgstPercent: doc.sgstPercent,
      igstPercent: doc.igstPercent,
      vatPercent: doc.vatPercent,
      cgstAmount: doc.cgstAmount ?? 0,
      sgstAmount: doc.sgstAmount ?? 0,
      igstAmount: doc.igstAmount ?? 0,
      vatAmount: doc.vatAmount ?? 0,
      gstAmount: doc.gstAmount ?? 0,
      roundOff: doc.roundOff ?? 0,
      grandTotal: doc.grandTotal,
      amountInWords: doc.amountInWords,
      amountPaid: doc.amountPaid,
      outstanding: doc.outstanding,
      paymentState: doc.paymentState,
      notes: doc.notes,
      terms: doc.terms,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findAll(): Promise<IClientInvoice[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }
}
