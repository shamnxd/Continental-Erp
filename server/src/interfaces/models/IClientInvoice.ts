import { IFinanceLineItem } from "./IFinanceLineItem";

export type InvoiceDocumentType =
  | "Tax Invoice"
  | "Proforma"
  | "AMC Invoice"
  | "Credit Note"
  | "AMC Upfront"
  | "Complaint Postpaid"
  | "Supplementary";

export type InvoiceDocumentStatus = "Draft" | "Approved" | "Cancelled";

export interface IClientInvoice {
  id?: string;
  invoiceNo: string;
  invoiceType: InvoiceDocumentType;
  documentStatus: InvoiceDocumentStatus;
  companyName: string;
  currency: string;
  clientId?: string;
  clientName: string;
  contactPerson?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  billingAddress?: string;
  siteAddress?: string;
  placeOfSupply?: string;
  enquiryId?: string;
  enquiryNo?: string;
  quotationId?: string;
  quotationNo?: string;
  complaintId?: string;
  complaintNo?: string;
  amcId?: string;
  amcNo?: string;
  smrId?: string;
  smrNo?: string;
  jobCardNo?: string;
  workOrderNo?: string;
  issueDate: string;
  dueDate: string;
  paymentTerms?: string;
  items: IFinanceLineItem[];
  subtotal: number;
  headerDiscount: number;
  taxableAmount: number;
  gstPercent: number;
  supplyType: "intra" | "inter";
  cgstPercent?: number;
  sgstPercent?: number;
  igstPercent?: number;
  vatPercent?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  vatAmount?: number;
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords?: string;
  amountPaid: number;
  outstanding: number;
  paymentState: "Fully Paid" | "Partially Paid" | "Advance Received" | "Overdue" | "Open";
  notes?: string;
  terms?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
