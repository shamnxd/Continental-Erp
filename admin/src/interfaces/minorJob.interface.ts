import { Client } from "./client.interface";

export interface MinorJob {
  id: string;
  jobNo: string;
  clientRef: string | Client;
  description: string;
  scheduledDate: string;
  status: "Open" | "In Progress" | "Completed";
  assignedTo: string;
  assignedStaffId?: string;
  quotationRef?: string;
  createdAt?: string;
  updatedAt?: string;
}
