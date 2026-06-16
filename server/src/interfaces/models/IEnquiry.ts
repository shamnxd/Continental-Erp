export type EnquiryStatus =
  | "Site Visit Scheduled"
  | "Quotation Prepared"
  | "Follow-up Required"
  | "Converted to Project"
  | "Converted to AMC"
  | "Converted to Minor Job"
  | "Closed";

export type EnquiryPriority = "High" | "Medium" | "Low";

import { IEnquiryActivity, IEnquiryRemark } from "./IEnquiryRemark";

export interface IEnquiryDrawing {
  name: string;
  storageKey?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  uploadDate: Date | string;
  uploadedBy: string;
}

export type { IEnquiryActivity, IEnquiryRemark, EnquiryActivityType } from "./IEnquiryRemark";

export interface IEnquiry {
  id?: string;
  enquiryNo: string;
  date: Date | string;
  clientId: string;
  clientRef?: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  clientLocation?: string;
  requirement: string;
  description: string;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  assignedTo: string;
  assignedStaffId?: string;
  followUpDate?: Date | string | null;
  drawings: IEnquiryDrawing[];
  remarks?: IEnquiryRemark[];
  activityLog?: IEnquiryActivity[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
