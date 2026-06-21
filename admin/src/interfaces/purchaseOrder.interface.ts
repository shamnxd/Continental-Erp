export interface PurchaseOrderLineItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
}

export interface PurchaseOrderRevision {
  revisionNo: number;
  vendorName: string;
  amount: number;
  items: PurchaseOrderLineItem[];
  pdfUrl?: string;
  pdfStorageKey?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PurchaseOrderActivity {
  message: string;
  user: string;
  date: string;
}

export interface PurchaseOrderDocument {
  name: string;
  url: string;
  storageKey: string;
  uploadedBy: string;
  uploadedDate: string;
}

export interface PurchaseOrder {
  id?: string;
  projectRef: string;
  poNo: string;
  vendorName: string;
  amount: number;
  status: "Pending" | "Approved" | "Ordered" | "Delivered";
  items: PurchaseOrderLineItem[];
  pdfUrl?: string;
  pdfStorageKey?: string;
  pdfDocs?: PurchaseOrderDocument[];
  revision: number;
  revisions?: PurchaseOrderRevision[];
  activityLog?: PurchaseOrderActivity[];
  createdAt?: string;
  updatedAt?: string;
}

