import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientInvoiceRepository } from "../../interfaces/repositories/IClientInvoiceRepository";
import { IEmailService } from "../../interfaces/services/IEmailService";

@injectable()
export class SendInvoiceEmailUseCase
  implements
    IUseCase<
      {
        invoiceId: string;
        recipientEmail: string;
        message?: string;
      },
      boolean
    >
{
  constructor(
    @inject("ClientInvoiceRepository")
    private _invoiceRepository: IClientInvoiceRepository,
    @inject("EmailService")
    private _emailService: IEmailService
  ) {}

  async execute(params: {
    invoiceId: string;
    recipientEmail: string;
    message?: string;
  }): Promise<boolean> {
    // Fetch the invoice
    const invoice = await this._invoiceRepository.findById(params.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // For now, we'll send a simplified version
    // In a production setup, you would:
    // 1. Generate PDF from invoice data
    // 2. Attach PDF to email
    // 3. Send via email service

    const success = await this._emailService.sendInvoiceEmail({
      recipientEmail: params.recipientEmail,
      invoiceNo: invoice.invoiceNo,
      clientName: invoice.clientName,
      invoiceData: JSON.stringify(invoice), // Placeholder - would be PDF in production
      message: params.message,
    });

    return success;
  }
}
