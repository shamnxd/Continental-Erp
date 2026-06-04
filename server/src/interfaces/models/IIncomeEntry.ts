export interface IIncomeEntry {
  id?: string;
  source: string;
  sourceType: "Client Payment" | "AMC Renewal" | "Advance" | "Refund" | "Other";
  clientId?: string;
  clientName?: string;
  incomeDate: string;
  expectedDate?: string;
  expectedAmount: number;
  actualReceived: number;
  paymentMethod?: string;
  referenceNo?: string;
  enquiryId?: string;
  enquiryNo?: string;
  quotationId?: string;
  quotationNo?: string;
  complaintId?: string;
  complaintNo?: string;
  amcId?: string;
  amcNo?: string;
  appliedToInvoiceId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
