import { injectable } from "tsyringe";
import { IEmailService } from "../interfaces/services/IEmailService";

@injectable()
export class EmailService implements IEmailService {
  async sendInvoiceEmail(params: {
    recipientEmail: string;
    invoiceNo: string;
    clientName: string;
    invoiceData: string;
    message?: string;
  }): Promise<boolean> {
    try {
      // TODO: Implement actual email sending with nodemailer
      console.log(`📧 Email would be sent to: ${params.recipientEmail} for invoice ${params.invoiceNo}`);
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

  async sendStaffWelcomeEmail(params: {
    recipientEmail: string;
    staffName: string;
    staffNo: string;
    password: string;
  }): Promise<boolean> {
    try {
      // TODO: Replace with real nodemailer transport for production:
      // import nodemailer from "nodemailer";
      // const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS } });
      // await transporter.sendMail({ from: env.EMAIL_FROM, to: params.recipientEmail, subject: "Your Staff Portal Credentials", html: this.buildStaffWelcomeTemplate(params) });

      console.log(`\n📧 ===================================`);
      console.log(`   STAFF WELCOME EMAIL (DEV MODE)`);
      console.log(`   To     : ${params.recipientEmail}`);
      console.log(`   Staff  : ${params.staffName} (${params.staffNo})`);
      console.log(`   Pass   : ${params.password}`);
      console.log(`=====================================\n`);

      return true;
    } catch (error) {
      console.error("Error sending staff welcome email:", error);
      return false;
    }
  }

  private buildStaffWelcomeTemplate(params: {
    staffName: string;
    staffNo: string;
    password: string;
    recipientEmail: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #be185d 0%, #9d174d 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .credentials { background: #fdf2f8; border: 1px solid #f9a8d4; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .warning { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #92400e; margin: 16px 0; }
          .footer { background: #f9fafb; padding: 16px 20px; text-align: center; font-size: 12px; color: #9ca3af; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to the Team!</h1><p>Your staff portal account has been created</p></div>
          <div class="content">
            <p>Hi <strong>${params.staffName}</strong>,</p>
            <p>Your staff account has been set up. Log in to the Staff Portal to view your assigned tasks and manage leave requests.</p>
            <div class="credentials">
              <p><strong>Staff ID:</strong> ${params.staffNo}</p>
              <p><strong>Email:</strong> ${params.recipientEmail}</p>
              <p><strong>Password:</strong> <code>${params.password}</code></p>
            </div>
            <div class="warning">⚠️ Please change your password after your first login.</div>
            <p>Best regards,<br><strong>Continental Service Management</strong></p>
          </div>
          <div class="footer"><p>This is an automated email. Please do not reply.</p></div>
        </div>
      </body>
      </html>
    `;
  }
}
