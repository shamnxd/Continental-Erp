export type EnquiryStatus =
  | "Site Visit Scheduled"
  | "Quotation Prepared"
  | "Follow-up Required"
  | "Converted to Project"
  | "Converted to AMC"
  | "Converted to Minor Job"
  | "Closed";

export type EnquiryPriority = "High" | "Medium" | "Low";

export interface EnquiryDrawing {
  name: string;
  storageKey?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  uploadDate: string;
  uploadedBy: string;
}

export type EnquiryActivityType =
  | "created"
  | "assigned"
  | "reassigned"
  | "status_changed"
  | "priority_changed"
  | "updated"
  | "remark_added"
  | "file_uploaded";

export interface EnquiryRemark {
  id?: string;
  user: string;
  date: string;
  text: string;
}

export interface EnquiryActivity {
  type: EnquiryActivityType;
  message: string;
  user: string;
  date: string;
}

export interface Enquiry {
  id?: string;
  enquiryNo: string;
  date: string;
  clientId: string;
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
  followUpDate?: string | null;
  drawings: EnquiryDrawing[];
  remarks?: EnquiryRemark[];
  activityLog?: EnquiryActivity[];
  createdAt?: string;
  updatedAt?: string;
}
