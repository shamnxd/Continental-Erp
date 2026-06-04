import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IVendorBill } from "../../interfaces/models/IVendorBill";
import { IVendorBillRepository } from "../../interfaces/repositories/IVendorBillRepository";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";
import { CreateVendorBillDto } from "../../dtos/finance.dto";
import { computeOutstanding, computeVendorBillStatus } from "../../utils/financeCalculations";
import { computeInvoiceTotals, normalizeFinanceLineItems } from "../../utils/invoiceTotals";

function buildBillNo(existingCount: number): string {
  const year = new Date().getFullYear();
  return `BILL-${year}-${String(existingCount + 1).padStart(3, "0")}`;
}

@injectable()
export class CreateVendorBillUseCase implements IUseCase<CreateVendorBillDto, IVendorBill> {
  constructor(
    @inject("VendorBillRepository")
    private _billRepository: IVendorBillRepository,
    @inject("LedgerEntryRepository")
    private _ledgerRepository: ILedgerEntryRepository,
  ) {}

  public async execute(dto: CreateVendorBillDto): Promise<IVendorBill> {
    const existing = await this._billRepository.findAll();
    const items = normalizeFinanceLineItems(dto.items);
    const gstPercent = dto.gstPercent ?? 18;
    const totals = computeInvoiceTotals(items, gstPercent, "intra", 0);
    const { subtotal, gstAmount, grandTotal: total } = {
      subtotal: totals.subtotal,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
    };
    const amountPaid = dto.amountPaid ?? 0;
    const outstanding = computeOutstanding(total, amountPaid);
    const status = computeVendorBillStatus(total, amountPaid, dto.dueDate);
    const billNo = dto.billNo?.trim() || buildBillNo(existing.length);

    const bill = await this._billRepository.create({
      billNo,
      vendor: dto.vendor,
      vendorGstin: dto.vendorGstin?.trim() || undefined,
      vendorInvoiceNo: dto.vendorInvoiceNo?.trim() || undefined,
      category: dto.category,
      billDate: dto.billDate,
      dueDate: dto.dueDate,
      paymentTerms: dto.paymentTerms?.trim() || undefined,
      referenceNo: dto.referenceNo?.trim() || undefined,
      items,
      subtotal,
      gstPercent,
      gstAmount,
      total,
      amountPaid,
      outstanding,
      status,
      notes: dto.notes?.trim() || undefined,
    });

    if (total > 0) {
      await this._ledgerRepository.create({
        date: dto.billDate,
        refType: "VENDOR_BILL",
        refNo: billNo,
        narration: `Payable raised — ${dto.vendor} (${dto.category})`,
        debit: 0,
        credit: total,
      });
    }

    return bill;
  }
}
