export const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "Card",
  "Other",
] as const;

export const INCOME_SOURCE_TYPES = [
  "Client Payment",
  "AMC Renewal",
  "Advance",
  "Refund",
  "Other",
] as const;

export const EXPENSE_STATUSES = ["Planned", "Recorded", "Paid"] as const;

export const INVOICE_TYPES = [
  "Tax Invoice",
  "Proforma",
  "AMC Invoice",
  "Credit Note",
] as const;

export const INVOICE_DOCUMENT_STATUS = ["Draft", "Approved", "Cancelled"] as const;

/** What job this invoice is billing against — drives which reference fields appear. */
export const BILLING_SOURCES = [
  { value: "quotation", label: "From quotation" },
  { value: "complaint", label: "Service / complaint" },
  { value: "amc", label: "AMC contract" },
  { value: "direct", label: "Direct (no source doc)" },
] as const;

export type BillingSource = (typeof BILLING_SOURCES)[number]["value"];

export const LINE_UNITS = ["Nos", "Hrs", "Days", "Job", "Ltr", "Mtr", "Set"] as const;

export const ROUND_OFF_MODES = [
  { value: "auto", label: "Auto (nearest ₹)" },
  { value: "none", label: "No round off" },
  { value: "manual", label: "Manual adjustment" },
] as const;

export type RoundOffMode = (typeof ROUND_OFF_MODES)[number]["value"];

export const TAX_SCHEMES = [
  { value: "gst_intra", label: "GST — same state (CGST + SGST)" },
  { value: "gst_inter", label: "GST — other state (IGST)" },
  { value: "vat", label: "VAT (export / non-GST)" },
] as const;

export const DEFAULT_COMPANY_NAME = "Continental";

export const DEFAULT_INVOICE_TERMS =
  "Payment is due as per the due date on this invoice. Late payments may attract interest. All disputes are subject to local jurisdiction.";

export function currentPeriodMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function dueDateFromPaymentTerms(issueDate: string, paymentTerms: string): string {
  const base = new Date(issueDate);
  if (Number.isNaN(base.getTime())) return issueDate;
  const daysMap: Record<string, number> = {
    "Due on Receipt": 0,
    "Net 7": 7,
    "Net 15": 15,
    "Net 30": 30,
    "Net 45": 45,
    "Net 60": 60,
  };
  base.setDate(base.getDate() + (daysMap[paymentTerms] ?? 30));
  return base.toISOString().split("T")[0];
}
