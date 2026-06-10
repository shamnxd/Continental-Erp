export type RemarkEntityType =
  | "enquiry"
  | "complaint"
  | "complaint_request"
  | "amc"
  | "project"
  | "minorjob"
  | "warranty"
  | "quotation";

export interface RemarkAttachment {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Remark {
  id?: string;
  entityType: RemarkEntityType;
  entityId: string;
  user: string;
  text: string;
  attachments?: RemarkAttachment[];
  parentRemarkId?: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}
