import { injectable } from "tsyringe";
import { IEmailService } from "../../interfaces/services/IEmailService";

@injectable()
export class EmailService implements IEmailService {
  /**
   * Send invoice email to client
   * This is a placeholder implementation
   * To use with actual email sending:
   * 1. Install nodemailer: npm install nodemailer
   * 2. Configure with your email provider (Gmail, SendGrid, etc.)
   * 3. Implement the actual email sending logic below
   */
  async sendInvoiceEmail(params: {
    recipientEmail: string;
    invoiceNo: string;
    clientName: string;
    invoiceData: string;
    message?: string;
  }): Promise<boolean> {
    try {
      // TODO: Implement actual email sending
      // Example with nodemailer:
      // const transporter = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: process.env.EMAIL_USER,
      //     pass: process.env.EMAIL_PASSWORD
      //   }
      // });
      //
      // await transporter.sendMail({
      //   from: process.env.EMAIL_FROM || 'noreply@continental.com',
      //   to: params.recipientEmail,
      //   subject: `Invoice ${params.invoiceNo}`,
      //   html: this.buildEmailTemplate(params),
      //   attachments: [
      //     {
      //       filename: `Invoice-${params.invoiceNo}.pdf`,
      //       content: Buffer.from(params.invoiceData, 'base64')
      //     }
      //   ]
      // });

      // Log email for now (development)
      console.log(
        `📧 Email would be sent to: ${params.recipientEmail} for invoice ${params.invoiceNo}`
      );

      // Simulate email sending
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`✓ Invoice ${params.invoiceNo} sent to ${params.recipientEmail}`);
          resolve(true);
        }, 500);
      });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      return false;
    }
  }

  /**
   * Build professional email template
   */
  private buildEmailTemplate(params: {
    recipientEmail: string;
    invoiceNo: string;
    clientName: string;
    message?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #be185d 0%, #9d174d 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
          .signature { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${params.invoiceNo}</h1>
          </div>
          <div class="content">
            <p>Dear ${params.clientName},</p>
            ${params.message ? `<p>${params.message.replace(/\n/g, "<br>")}</p>` : ""}
            <p>Please find attached your invoice for your records.</p>
            <div class="signature">
              <p>Best regards,<br>Continental Service Management</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this address.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
