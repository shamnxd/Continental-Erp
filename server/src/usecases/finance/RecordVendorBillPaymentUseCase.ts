import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IVendorBill } from "../../interfaces/models/IVendorBill";
import { IVendorBillRepository } from "../../interfaces/repositories/IVendorBillRepository";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";
import { RecordVendorBillPaymentDto } from "../../dtos/finance.dto";
import {
  buildPaymentOutNo,
  computeOutstanding,
  computeVendorBillStatus,
} from "../../utils/financeCalculations";

@injectable()
export class RecordVendorBillPaymentUseCase
  implements IUseCase<{ billId: string; data: RecordVendorBillPaymentDto }, IVendorBill | null>
{
  constructor(
    @inject("VendorBillRepository")
    private _billRepository: IVendorBillRepository,
    @inject("LedgerEntryRepository")
    private _ledgerRepository: ILedgerEntryRepository,
  ) {}

  public async execute(params: {
    billId: string;
    data: RecordVendorBillPaymentDto;
  }): Promise<IVendorBill | null> {
    const bill = await this._billRepository.findById(params.billId);
    if (!bill) return null;

    const amountPaid = bill.amountPaid + params.data.amount;
    const outstanding = computeOutstanding(bill.total, amountPaid);
    const status = computeVendorBillStatus(bill.total, amountPaid, bill.dueDate);
    const paymentDate =
      params.data.paymentDate?.trim() || new Date().toISOString().split("T")[0];

    const updated = await this._billRepository.update(params.billId, {
      amountPaid,
      outstanding,
      status,
    });

    const ledgerEntries = await this._ledgerRepository.findAll();
    const refNo = buildPaymentOutNo(ledgerEntries.length);
    const note = params.data.note?.trim();
    await this._ledgerRepository.create({
      date: paymentDate,
      refType: "PAYMENT_OUT",
      refNo,
      narration: note
        ? `Payment made — ${bill.vendor} (${bill.billNo}): ${note}`
        : `Payment made — ${bill.vendor} (${bill.billNo})`,
      debit: 0,
      credit: params.data.amount,
    });

    return updated;
  }
}
