import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientInvoice } from "../../interfaces/models/IClientInvoice";
import { IClientInvoiceRepository } from "../../interfaces/repositories/IClientInvoiceRepository";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";
import { CreateClientInvoiceDto } from "../../dtos/finance.dto";
import {
  buildInvoiceNo,
  computeInvoicePaymentState,
  computeOutstanding,
} from "../../utils/financeCalculations";
import { amountInWordsInr } from "../../utils/amountInWords";
import { computeInvoiceTotals, normalizeFinanceLineItems } from "../../utils/invoiceTotals";

@injectable()
export class CreateClientInvoiceUseCase implements IUseCase<CreateClientInvoiceDto, IClientInvoice> {
  constructor(
    @inject("ClientInvoiceRepository")
    private _invoiceRepository: IClientInvoiceRepository,
    @inject("LedgerEntryRepository")
    private _ledgerRepository: ILedgerEntryRepository,
  ) {}

  public async execute(dto: CreateClientInvoiceDto): Promise<IClientInvoice> {
    const existing = await this._invoiceRepository.findAll();
    const items = normalizeFinanceLineItems(dto.items);
    const supplyType = dto.supplyType ?? "intra";
    const cgstPercent = dto.cgstPercent ?? (supplyType === "intra" ? (dto.gstPercent ?? 18) / 2 : 0);
    const sgstPercent = dto.sgstPercent ?? (supplyType === "intra" ? (dto.gstPercent ?? 18) / 2 : 0);
    const igstPercent = dto.igstPercent ?? (supplyType === "inter" ? dto.gstPercent ?? 18 : 0);
    const vatPercent = dto.vatPercent ?? 0;
    const gstPercent =
      dto.gstPercent ??
      (vatPercent > 0 ? vatPercent : igstPercent > 0 ? igstPercent : cgstPercent + sgstPercent);
    const totals = computeInvoiceTotals(
      items,
      gstPercent,
      supplyType,
      dto.headerDiscount ?? 0,
      dto.roundOff,
      { cgstPercent, sgstPercent, igstPercent, vatPercent },
    );
    const amountPaid = dto.amountPaid ?? 0;
    const outstanding = computeOutstanding(totals.grandTotal, amountPaid);
    const paymentState = computeInvoicePaymentState(totals.grandTotal, amountPaid, dto.dueDate);
    const invoiceNo = dto.invoiceNo?.trim() || buildInvoiceNo(existing.length);

    const invoice = await this._invoiceRepository.create({
      invoiceNo,
      invoiceType: dto.invoiceType,
      documentStatus: dto.documentStatus ?? "Draft",
      companyName: dto.companyName?.trim() || "Continental",
      currency: dto.currency?.trim() || "INR",
      clientId: dto.clientId?.trim() || undefined,
      clientName: dto.clientName,
      contactPerson: dto.contactPerson?.trim() || undefined,
      clientEmail: dto.clientEmail?.trim() || undefined,
      clientPhone: dto.clientPhone?.trim() || undefined,
      clientGstin: dto.clientGstin?.trim() || undefined,
      billingAddress: dto.billingAddress?.trim() || undefined,
      siteAddress: dto.siteAddress?.trim() || undefined,
      placeOfSupply: dto.placeOfSupply?.trim() || undefined,
      enquiryId: dto.enquiryId?.trim() || undefined,
      enquiryNo: dto.enquiryNo?.trim() || undefined,
      quotationId: dto.quotationId?.trim() || undefined,
      quotationNo: dto.quotationNo?.trim() || undefined,
      complaintId: dto.complaintId?.trim() || undefined,
      complaintNo: dto.complaintNo?.trim() || undefined,
      amcId: dto.amcId?.trim() || undefined,
      amcNo: dto.amcNo?.trim() || undefined,
      smrId: dto.smrId?.trim() || undefined,
      smrNo: dto.smrNo?.trim() || undefined,
      jobCardNo: dto.jobCardNo?.trim() || undefined,
      workOrderNo: dto.workOrderNo?.trim() || undefined,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      paymentTerms: dto.paymentTerms?.trim() || undefined,
      items,
      subtotal: totals.subtotal,
      headerDiscount: totals.discountTotal,
      taxableAmount: totals.taxableAmount,
      gstPercent,
      supplyType,
      cgstPercent: cgstPercent || undefined,
      sgstPercent: sgstPercent || undefined,
      igstPercent: igstPercent || undefined,
      vatPercent: vatPercent || undefined,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      vatAmount: totals.vatAmount,
      gstAmount: totals.gstAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountInWords: amountInWordsInr(totals.grandTotal),
      amountPaid,
      outstanding,
      paymentState,
      notes: dto.notes?.trim() || undefined,
      terms: dto.terms?.trim() || undefined,
    });

    if (totals.grandTotal > 0 && dto.documentStatus !== "Cancelled") {
      await this._ledgerRepository.create({
        date: dto.issueDate,
        refType: "INVOICE",
        refNo: invoiceNo,
        narration: `Receivable raised — ${dto.clientName} (${dto.invoiceType})`,
        debit: totals.grandTotal,
        credit: 0,
      });
    }

    return invoice;
  }
}
