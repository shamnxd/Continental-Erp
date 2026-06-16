import { Client } from "./client.interface";
import { Project } from "./project.interface";

export interface Warranty {
  id?: string;
  warrantyNo: string;
  clientRef: string | Client;
  projectRef?: string | Project;
  product: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Claimed";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedWarranties {
  data: Warranty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
