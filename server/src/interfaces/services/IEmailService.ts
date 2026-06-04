export interface IEmailService {
  sendInvoiceEmail(params: {
    recipientEmail: string;
    invoiceNo: string;
    clientName: string;
    invoiceData: string; // HTML content
    message?: string;
  }): Promise<boolean>;
}
