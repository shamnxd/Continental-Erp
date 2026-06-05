import { IRemark } from "./IComplaint";

export interface IComplaintRequest {
  id?: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  location: string;
  issue: string;
  description: string;
  status: "Pending" | "Converted" | "Rejected";
  convertedComplaintId?: string;
  remarks?: IRemark[];
  createdAt?: Date;
  updatedAt?: Date;
}
