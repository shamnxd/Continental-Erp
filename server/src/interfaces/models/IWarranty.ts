import { IClient } from "./IClient";
import { IProject } from "./IProject";

export interface IWarranty {
  id?: string;
  warrantyNo: string;
  clientRef: string | IClient;
  projectRef?: string | IProject;
  product: string;
  startDate: Date;
  endDate: Date;
  status: "Active" | "Expiring Soon" | "Expired" | "Claimed";
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
