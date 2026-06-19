export interface ITallySyncQueue {
  id?: string;
  entityType: "Client" | "Quotation" | "PurchaseOrder" | "Invoice";
  entityId: string;
  payload: Record<string, any>;
  status: "Pending" | "Processing" | "Synced" | "Failed";
  attempts: number;
  lastError?: string;
  syncedAt?: Date;
}
