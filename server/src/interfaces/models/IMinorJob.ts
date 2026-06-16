import { IClient } from "./IClient";

export interface IMinorJob {
  id?: string;
  jobNo: string;
  clientRef: string | IClient;
  description: string;
  scheduledDate: Date;
  status: "Open" | "In Progress" | "Completed";
  assignedTo: string;
  assignedStaffId?: string;
  quotationRef?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
