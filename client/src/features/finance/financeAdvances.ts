import type { IncomeEntry } from "../../interfaces/finance.interface";

/** Sum customer advances/payments not yet applied to an invoice, for a linked source. */
export function unappliedAdvanceTotal(
  payments: IncomeEntry[],
  filter: {
    quotationId?: string;
    amcId?: string;
    complaintId?: string;
    enquiryId?: string;
  },
): number {
  return payments
    .filter((p) => !p.appliedToInvoiceId && (p.actualReceived > 0 || p.sourceType === "Advance"))
    .filter((p) => {
      if (filter.quotationId && p.quotationId === filter.quotationId) return true;
      if (filter.amcId && p.amcId === filter.amcId) return true;
      if (filter.complaintId && p.complaintId === filter.complaintId) return true;
      if (filter.enquiryId && p.enquiryId === filter.enquiryId) return true;
      return false;
    })
    .reduce((sum, p) => sum + (p.actualReceived || 0), 0);
}
