export type AmcContractStatus = "Active" | "Due for Renewal" | "Expired";
export type AmcFrequency = "Monthly" | "Quarterly" | "Bi-Annual" | "Annual";

export interface AmcRemark {
  id?: string;
  user: string;
  date: string;
  text: string;
}

export interface AmcPayment {
  date: string;
  amount: number;
  type: "Advance" | "Payment";
  note?: string;
  recordedBy?: string;
}

export interface AmcContract {
  id?: string;
  amcNo: string;
  clientId: string;
  clientName: string;
  clientLogoUrl?: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  startDate: string;
  endDate: string;
  frequency: AmcFrequency;
  nextVisit?: string | null;
  status: AmcContractStatus;
  amount: number;
  visitsCompleted: number;
  totalVisits: number;
  serviceType: string;
  notes?: string;
  remarks?: AmcRemark[];
  advancePaid?: number;
  payments?: AmcPayment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAmcPayload {
  clientId: string;
  startDate: string;
  endDate: string;
  frequency: AmcFrequency;
  amount: number;
  totalVisits: number;
  serviceType: string;
  notes?: string;
  renewalOfAmcId?: string;
}

export type UpdateAmcPayload = Partial<CreateAmcPayload>;

export type AmcVisitStatus = "Scheduled" | "Completed" | "Cancelled";

export interface AmcVisitStaff {
  id: string;
  fullName: string;
}

export interface AmcVisit {
  id?: string;
  amcId: string;
  scheduledDate: string;
  status: AmcVisitStatus;
  notes?: string;
  assignedStaffIds?: string[];
  assignedStaff?: AmcVisitStaff[];
  smrId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleAmcVisitPayload {
  scheduledDate: string;
  notes?: string;
  assignedStaffIds?: string[];
}
