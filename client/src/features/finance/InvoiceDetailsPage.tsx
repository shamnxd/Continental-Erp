import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { AppRoute } from "../../constants/routes.enum";
import { getClientInvoiceByIdApi, sendInvoiceEmailApi } from "../../api/finance.api";
import type { ClientInvoice } from "../../interfaces/finance.interface";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { downloadInvoiceAsPDF } from "../../utils/invoicePdf";

export function InvoiceDetailsPage() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [invoice, setInvoice] = useState<ClientInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (!invoiceId) {
      navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES);
      return;
    }

    const loadInvoice = async () => {
      setIsLoading(true);
      try {
        const res = await getClientInvoiceByIdApi(invoiceId);
        if (res.success) {
          setInvoice(res.data);
        } else {
          toast.error("Invoice not found");
          navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES);
        }
      } catch (error) {
        toast.error("Failed to load invoice");
        navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, navigate]);

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      await downloadInvoiceAsPDF("invoice-preview-content", invoice.invoiceNo);
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handleSendEmail = async (
    recipientEmail: string,
    message: string
  ) => {
    if (!invoice) return;
    try {
      const res = await sendInvoiceEmailApi(invoice.id, {
        recipientEmail,
        message,
      });
      if (res.success) {
        toast.success("Invoice sent successfully");
      } else {
        toast.error(res.message || "Failed to send invoice");
      }
    } catch (error) {
      toast.error("Failed to send invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Invoice {invoice.invoiceNo}</h2>
          <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
        </div>
      </div>

      {/* Hidden div for PDF generation */}
      <div id="invoice-preview-content" className="hidden">
        <div className="bg-white text-black" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", padding: "40px", lineHeight: "1.4" }}>
          <div>
            {/* Company Header */}
            <div style={{ marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #000" }}>
              <h1 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold" }}>
                {invoice.companyName}
              </h1>
              <p style={{ margin: "0", fontSize: "9px", color: "#666" }}>
                {invoice.companyAddress || "A Complete Web Solution"}
              </p>
              {invoice.gstNumber && (
                <p style={{ margin: "0", fontSize: "9px", color: "#666" }}>
                  GSTIN No. {invoice.gstNumber}
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
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>₹{item.rate.toFixed(2)}</td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>₹{item.total.toFixed(2)}</td>
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
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>₹{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  {invoice.advancePaid !== undefined && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>Less: Advance Paid</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>₹{(invoice.advancePaid || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: "#f9f9f9" }}>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left", fontWeight: "bold" }}>Taxable Value Before Tax</td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>₹{(invoice.subtotal - (invoice.advancePaid || 0)).toFixed(2)}</td>
                  </tr>
                  {invoice.cgstPercent !== undefined && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>CGST {invoice.cgstPercent}%</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>₹{invoice.cgstAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {invoice.sgstPercent !== undefined && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>SGST {invoice.sgstPercent}%</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>₹{invoice.sgstAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {invoice.roundOff !== undefined && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>Round off</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>₹{(invoice.roundOff || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: "#e8f4f8" }}>
                    <td style={{ border: "1px solid #000", padding: "7px", textAlign: "left", fontWeight: "bold", fontSize: "11px" }}>Total Invoice Value</td>
                    <td style={{ border: "1px solid #000", padding: "7px", textAlign: "right", fontWeight: "bold", fontSize: "11px" }}>₹{invoice.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bank Details */}
            <div style={{ marginBottom: "20px", fontSize: "9px" }}>
              <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>Bank Details</p>
              {invoice.bankName && (
                <>
                  <p style={{ margin: "0" }}>Name : {invoice.bankName}</p>
                  {invoice.accountNumber && <p style={{ margin: "0" }}>A/C No. : {invoice.accountNumber}</p>}
                  {invoice.ifscCode && <p style={{ margin: "0" }}>IFSC : {invoice.ifscCode}</p>}
                </>
              )}
            </div>

            {/* Signature Lines */}
            <div style={{ marginBottom: "30px", marginTop: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "23%", textAlign: "center" }}>
                  <div style={{ height: "40px", borderTop: "1px solid #000", marginBottom: "5px" }}></div>
                  <p style={{ margin: "0", fontSize: "10px", fontWeight: "bold" }}>Prepared by</p>
                </div>
                <div style={{ width: "23%", textAlign: "center" }}>
                  <div style={{ height: "40px", borderTop: "1px solid #000", marginBottom: "5px" }}></div>
                  <p style={{ margin: "0", fontSize: "10px", fontWeight: "bold" }}>Checked by</p>
                </div>
                <div style={{ width: "23%", textAlign: "center" }}>
                  <div style={{ height: "40px", borderTop: "1px solid #000", marginBottom: "5px" }}></div>
                  <p style={{ margin: "0", fontSize: "10px", fontWeight: "bold" }}>Authorized by</p>
                </div>
                <div style={{ width: "23%", textAlign: "center" }}>
                  <div style={{ height: "60px", marginBottom: "5px", border: "2px dashed #999", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "9px" }}>
                    Company<br/>Stamp
                  </div>
                  <p style={{ margin: "0", fontSize: "9px" }}></p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginTop: "20px", fontSize: "9px", borderTop: "1px solid #000", paddingTop: "10px" }}>
                <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>NOTE:</p>
                <p style={{ margin: "0", whiteSpace: "pre-wrap", color: "#666" }}>{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && invoice && (
        <InvoicePreviewModal
          invoice={invoice}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          onSendEmail={handleSendEmail}
        />
      )}

      {/* Show back button when preview is closed */}
      {!showPreview && (
        <div className="flex justify-center">
          <Button onClick={() => setShowPreview(true)}>Open Preview</Button>
        </div>
      )}
    </div>
  );
}
