export type StaffEmploymentType = "Permanent" | "Outsource";
export type StaffStatus = "Available" | "On Site" | "On Leave" | "Inactive";

export interface IStaff {
  id?: string;
  staffNo: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  role: string;
  customRole?: string;
  employmentType: StaffEmploymentType;
  specialization?: string;
  status: StaffStatus;
  notes?: string;
  isActive: boolean;
  passwordHash?: string;
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffWorkHistoryItem {
  complaintId: string;
  complaintNo: string;
  clientName: string;
  issue: string;
  status: string;
  priority: string;
  date: Date;
  location: string;
}
