export interface ISubcontract {
  id?: string;
  projectRef: string;
  contractorName: string;
  scopeOfWork: string;
  value: number;
  status: "Pending" | "Active" | "Completed";
  completionReportUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
