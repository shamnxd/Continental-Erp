export interface Subcontract {
  id?: string;
  projectRef: string;
  contractorName: string;
  scopeOfWork: string;
  value: number;
  status: "Pending" | "Active" | "Completed";
  completionReportUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
