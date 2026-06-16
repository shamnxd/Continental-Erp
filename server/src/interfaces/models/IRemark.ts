export type RemarkEntityType =
  | "enquiry"
  | "complaint"
  | "complaint_request"
  | "amc"
  | "project"
  | "minorjob"
  | "warranty"
  | "quotation"
  | "subcontract"
  | "purchase_order";

export interface IRemarkAttachment {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface IRemark {
  id?: string;
  entityType: RemarkEntityType;
  entityId: string;
  user: string;
  text: string;
  attachments?: IRemarkAttachment[];
  parentRemarkId?: string | null;
  date: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
