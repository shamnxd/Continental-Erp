import { Download, Mail, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import type { ClientInvoice } from "../../interfaces/finance.interface";
import { useState } from "react";
import { toast } from "sonner";
import { formatInr } from "./financeUtils";

export interface InvoicePreviewModalProps {
  invoice: ClientInvoice;
  onClose: () => void;
  onDownload: () => Promise<void>;
  onSendEmail: (email: string, message: string) => Promise<void>;
}

export function InvoicePreviewModal({
  invoice,
  onClose,
  onDownload,
  onSendEmail,
}: InvoicePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: invoice.clientEmail || "",
    message: `Dear ${invoice.contactPerson || invoice.clientName},\n\nPlease find attached your invoice ${invoice.invoiceNo}.\n\nBest regards`,
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    setIsSendingEmail(true);
    try {
      await onSendEmail(emailData.recipientEmail, emailData.message);
      toast.success("Invoice sent successfully");
      setShowEmailForm(false);
    } catch (error) {
      toast.error("Failed to send invoice");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Actions */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Invoice Preview - {invoice.invoiceNo}</h2>
          <div className="flex gap-2 items-center">
            {!showEmailForm && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download PDF"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowEmailForm(true)}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send to Client
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded ml-2"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {!showEmailForm ? (
            <>
              {/* Professional Invoice Content */}
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", lineHeight: "1.4" }}>
                {/* Company Header */}
                <div style={{ marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #000" }}>
                  <h1 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold" }}>
                    {invoice.companyName}
                  </h1>
                  {invoice.companyAddress && (
                    <p style={{ margin: "0", fontSize: "9px", color: "#666" }}>
                      {invoice.companyAddress}
                    </p>
                  )}
                </div>

                {/* Invoice Title and Details */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold" }}>INVOICE</h2>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 5px 0", fontSize: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Invoice No: </span>{invoice.invoiceNo}
                    </p>
                    <p style={{ margin: "0", fontSize: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Date: </span>{invoice.issueDate}
                    </p>
                  </div>
                </div>

                {/* Bill To Section */}
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "10px", textTransform: "uppercase" }}>To,</p>
                  <p style={{ margin: "0 0 3px 0", fontWeight: "bold" }}>{invoice.clientName}</p>
                  {invoice.billingAddress && (
                    <p style={{ margin: "0 0 3px 0", fontSize: "10px", color: "#666", whiteSpace: "pre-wrap" }}>
                      {invoice.billingAddress}
                    </p>
                  )}
                  {invoice.clientGstin && (
                    <p style={{ margin: "0", fontSize: "10px" }}>
                      GSTIN/UIN: <span style={{ fontWeight: "bold" }}>{invoice.clientGstin}</span>
                    </p>
                  )}
                </div>

                {/* Name of Work and Work Order */}
                <table style={{ width: "100%", marginBottom: "15px", borderCollapse: "collapse", border: "1px solid #000" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "40%", padding: "5px 8px", borderRight: "1px solid #000", fontWeight: "bold", fontSize: "10px" }}>
                        Name of Work
                      </td>
                      <td style={{ padding: "5px 8px", fontSize: "10px" }}>
                        {invoice.quotationNo ? `Ref: ${invoice.quotationNo}` : invoice.invoiceType}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: "40%", padding: "5px 8px", borderRight: "1px solid #000", fontWeight: "bold", fontSize: "10px", borderTop: "1px solid #000" }}>
                        Work Order No
                      </td>
                      <td style={{ padding: "5px 8px", fontSize: "10px", borderTop: "1px solid #000" }}>
                        {invoice.quotationNo || "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Line Items Table */}
                <table style={{ width: "100%", marginBottom: "15px", borderCollapse: "collapse", border: "1px solid #000", fontSize: "10px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left", fontWeight: "bold" }}>No.</th>
                      <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left", fontWeight: "bold" }}>Description</th>
                      <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontWeight: "bold", width: "60px" }}>Qty</th>
                      <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold", width: "80px" }}>Unit Price</th>
                      <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold", width: "80px" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #000", padding: "5px" }}>{item.description}</td>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{item.qty}</td>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>â‚¹{item.rate.toFixed(2)}</td>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>â‚¹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                  <table style={{ width: "300px", fontSize: "10px", borderCollapse: "collapse", border: "1px solid #000" }}>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>Taxable value</td>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>â‚¹{invoice.subtotal.toFixed(2)}</td>
                      </tr>
                      {invoice.advancePaid !== undefined && (
                        <tr>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>Less: Advance Paid</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>â‚¹{(invoice.advancePaid || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: "#f9f9f9" }}>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left", fontWeight: "bold" }}>Taxable Value Before Tax</td>
                        <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>â‚¹{(invoice.subtotal - (invoice.advancePaid || 0)).toFixed(2)}</td>
                      </tr>
                      {invoice.cgstPercent !== undefined && (
                        <tr>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>CGST {invoice.cgstPercent}%</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>â‚¹{invoice.cgstAmount.toFixed(2)}</td>
                        </tr>
                      )}
                      {invoice.sgstPercent !== undefined && (
                        <tr>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>SGST {invoice.sgstPercent}%</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>â‚¹{invoice.sgstAmount.toFixed(2)}</td>
                        </tr>
                      )}
                      {invoice.roundOff !== undefined && (
                        <tr>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>Round off</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>â‚¹{(invoice.roundOff || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: "#e8f4f8" }}>
                        <td style={{ border: "1px solid #000", padding: "7px", textAlign: "left", fontWeight: "bold", fontSize: "11px" }}>Total Invoice Value</td>
                        <td style={{ border: "1px solid #000", padding: "7px", textAlign: "right", fontWeight: "bold", fontSize: "11px" }}>â‚¹{invoice.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bank Details */}
                {invoice.bankName && (
                  <div style={{ marginBottom: "20px", fontSize: "9px" }}>
                    <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>Bank Details</p>
                    <p style={{ margin: "0" }}>Name : {invoice.bankName}</p>
                    {invoice.accountNumber && <p style={{ margin: "0" }}>A/C No. : {invoice.accountNumber}</p>}
                    {invoice.ifscCode && <p style={{ margin: "0" }}>IFSC : {invoice.ifscCode}</p>}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Email Form */
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-bold">Send Invoice to Client</h3>
              <div>
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={emailData.recipientEmail}
                  onChange={(e) =>
                    setEmailData({ ...emailData, recipientEmail: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a custom message to the client..."
                  value={emailData.message}
                  onChange={(e) =>
                    setEmailData({ ...emailData, message: e.target.value })
                  }
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isSendingEmail ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
