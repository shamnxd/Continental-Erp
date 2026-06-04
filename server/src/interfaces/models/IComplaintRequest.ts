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
  createdAt?: Date;
  updatedAt?: Date;
}
