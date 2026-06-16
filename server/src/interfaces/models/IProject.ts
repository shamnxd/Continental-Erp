import { IClient } from "./IClient";

export interface IProject {
  id?: string;
  projectNo: string;
  clientRef: string | IClient;
  name: string;
  startDate: Date;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  value: number;
  quotationRef?: string;
  expectedCompletionDate?: Date | string;
  actualCompletionDate?: Date | string;
  handoverDocs?: Array<{
    name: string;
    url: string;
    storageKey?: string;
    uploadedBy: string;
    uploadedDate: Date | string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}
