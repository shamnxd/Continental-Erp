export type QuotationStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Expired";

export interface QuotationLineItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
  section?: "machine_side" | "low_side";
  unit?: string;
  group?: string;
  isDescriptionOnly?: boolean;
}

export interface QuotationRemark {
  id?: string;
  user: string;
  date: string;
  text: string;
}

export interface Quotation {
  id?: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  clientId: string;
  clientName: string;
  enquiryId?: string;
  enquiryNo?: string;
  amount: number;
  gstPercent: number;
  machineGstPercent?: number;
  lowSideGstPercent?: number;
  gst: number;
  total: number;
  status: QuotationStatus;
  items: QuotationLineItem[];
  remarks?: QuotationRemark[];
  notes?: string;
  revision?: number;
  isActive?: boolean;
  costingId?: string;
  costingRevision?: number;
  clonedFromQuotationRevision?: number;
  createdAt?: string;
  updatedAt?: string;
  panNo?: string;
  serviceTaxNo?: string;
  gstin?: string;
  clientAddress?: string;
}
