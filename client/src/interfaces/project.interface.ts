import { Client } from "./client.interface";

export interface ProjectHandoverDoc {
  name: string;
  url: string;
  storageKey?: string;
  uploadedBy: string;
  uploadedDate: string;
}

export interface Project {
  id: string;
  projectNo: string;
  clientRef: string | Client;
  name: string;
  startDate: string;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  value: number;
  quotationRef?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  handoverDocs?: ProjectHandoverDoc[];
  createdAt?: string;
  updatedAt?: string;
}

