export interface Remark {
  id?: string;
  user: string;
  date: string;
  text: string;
}

export interface Complaint {
  id?: string;
  complaintNo: string;
  date: string;
  clientId: string;
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
  expectedResolution: string;
  remarks: Remark[];
  createdAt?: string;
  updatedAt?: string;
}
