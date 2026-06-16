export interface IPurchaseOrderLineItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
}

export interface IPurchaseOrderRevision {
  revisionNo: number;
  vendorName: string;
  amount: number;
  items: IPurchaseOrderLineItem[];
  pdfUrl?: string;
  pdfStorageKey?: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface IPurchaseOrderActivity {
  message: string;
  user: string;
  date: Date;
}

export interface IPurchaseOrderDocument {
  name: string;
  url: string;
  storageKey: string;
  uploadedBy: string;
  uploadedDate: Date | string;
}

export interface IPurchaseOrder {
  id?: string;
  projectRef: string;
  poNo: string;
  vendorName: string;
  amount: number;
  status: "Pending" | "Approved" | "Ordered" | "Delivered";
  items: IPurchaseOrderLineItem[];
  pdfUrl?: string;
  pdfStorageKey?: string;
  pdfDocs?: IPurchaseOrderDocument[];
  revision: number;
  revisions?: IPurchaseOrderRevision[];
  activityLog?: IPurchaseOrderActivity[];
  createdAt?: Date;
  updatedAt?: Date;
}

