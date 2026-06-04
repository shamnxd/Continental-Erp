export interface IEmailService {
  sendInvoiceEmail(params: {
    recipientEmail: string;
    invoiceNo: string;
    clientName: string;
    invoiceData: string; // HTML content
    message?: string;
  }): Promise<boolean>;

  sendStaffWelcomeEmail(params: {
    recipientEmail: string;
    staffName: string;
    staffNo: string;
    password: string;
  }): Promise<boolean>;
}
