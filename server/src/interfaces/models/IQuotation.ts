import { IEnquiryRemark } from "./IEnquiryRemark";

export type QuotationStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Expired";

export interface IQuotationLineItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
  section: "machine_side" | "low_side";
  unit?: string;
  group?: string;
  isDescriptionOnly?: boolean;
}

export interface IQuotation {
  id?: string;
  quotationNo: string;
  date: Date | string;
  validUntil: Date | string;
  clientId: string;
  clientRef?: string;
  clientName: string;
  clientLogoUrl?: string;
  clientAddress?: string;
  gstin?: string;
  enquiryId?: string;
  enquiryNo?: string;
  amount: number;
  gstPercent: number;
  machineGstPercent?: number;
  lowSideGstPercent?: number;
  gst: number;
  total: number;
  status: QuotationStatus;
  items: IQuotationLineItem[];
  remarks?: IEnquiryRemark[];
  notes?: string;
  revision?: number;
  isActive?: boolean;
  costingId?: string;
  costingRevision?: number;
  clonedFromQuotationRevision?: number;
  convertedTo?: {
    targetType: "project" | "amc" | "minorjob";
    targetId: string;
  };
  tallyVoucherNo?: string;
  tallySyncStatus?: "Pending" | "Synced" | "Failed";
  tallySyncError?: string;
  tallyLastSyncedAt?: Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
