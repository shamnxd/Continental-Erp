import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientInvoice } from "../../interfaces/models/IClientInvoice";
import { IClientInvoiceRepository } from "../../interfaces/repositories/IClientInvoiceRepository";
import { ILedgerEntryRepository } from "../../interfaces/repositories/ILedgerEntryRepository";
import { RecordInvoicePaymentDto } from "../../dtos/finance.dto";
import {
  buildReceiptNo,
  computeInvoicePaymentState,
  computeOutstanding,
} from "../../utils/financeCalculations";

@injectable()
export class RecordInvoicePaymentUseCase
  implements IUseCase<{ invoiceId: string; data: RecordInvoicePaymentDto }, IClientInvoice | null>
{
  constructor(
    @inject("ClientInvoiceRepository")
    private _invoiceRepository: IClientInvoiceRepository,
    @inject("LedgerEntryRepository")
    private _ledgerRepository: ILedgerEntryRepository,
  ) {}

  public async execute(params: {
    invoiceId: string;
    data: RecordInvoicePaymentDto;
  }): Promise<IClientInvoice | null> {
    const invoice = await this._invoiceRepository.findById(params.invoiceId);
    if (!invoice) return null;

    const amountPaid = invoice.amountPaid + params.data.amount;
    const outstanding = computeOutstanding(invoice.grandTotal, amountPaid);
    const paymentState = computeInvoicePaymentState(
      invoice.grandTotal,
      amountPaid,
      invoice.dueDate,
    );
    const paymentDate =
      params.data.paymentDate?.trim() || new Date().toISOString().split("T")[0];

    const updated = await this._invoiceRepository.update(params.invoiceId, {
      amountPaid,
      outstanding,
      paymentState,
    });

    const ledgerEntries = await this._ledgerRepository.findAll();
    const refNo = buildReceiptNo(ledgerEntries.length);
    const note = params.data.note?.trim();
    await this._ledgerRepository.create({
      date: paymentDate,
      refType: "PAYMENT_IN",
      refNo,
      narration: note
        ? `Payment received — ${invoice.clientName} (${invoice.invoiceNo}): ${note}`
        : `Payment received — ${invoice.clientName} (${invoice.invoiceNo})`,
      debit: params.data.amount,
      credit: 0,
    });

    return updated;
  }
}
