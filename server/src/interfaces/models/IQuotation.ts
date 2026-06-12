import { IEnquiryRemark } from "./IEnquiryRemark";

export type QuotationStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Expired";

export interface IQuotationLineItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
  section: "machine_side" | "low_side";
  unit?: string;
}

export interface IQuotation {
  id?: string;
  quotationNo: string;
  date: Date | string;
  validUntil: Date | string;
  clientId: string;
  clientRef?: string;
  clientName: string;
  enquiryId?: string;
  enquiryNo?: string;
  amount: number;
  gstPercent: number;
  gst: number;
  total: number;
  status: QuotationStatus;
  items: IQuotationLineItem[];
  remarks?: IEnquiryRemark[];
  notes?: string;
  revision?: number;
  isActive?: boolean;
  costingId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
