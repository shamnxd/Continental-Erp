export interface IRemark {
  user: string;
  date: Date | string;
  text: string;
}

export interface IComplaint {
  id?: string;
  complaintNo: string;
  date: Date;
  clientId: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  issue: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Resolved";
  assignedTo?: string[];
  location: string;
  expectedResolution: Date;
  remarks: IRemark[];
  createdAt?: Date;
  updatedAt?: Date;
}
