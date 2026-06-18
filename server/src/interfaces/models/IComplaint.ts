export interface IRemark {
  id?: string;
  user: string;
  date: Date | string;
  text: string;
}

export interface IComplaint {
  id?: string;
  complaintNo: string;
  date: Date;
  clientId: string;
  clientRef?: string;
  clientName: string;
  clientLogoUrl?: string;
  contactPerson: string;
  phone: string;
  issue: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Resolved";
  assignedTo?: string[];
  assignedStaffIds?: string[];
  location: string;
  expectedResolution: Date;
  remarks: IRemark[];
  createdAt?: Date;
  updatedAt?: Date;
}
