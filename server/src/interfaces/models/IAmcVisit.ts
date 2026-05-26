export type AmcVisitStatus = "Scheduled" | "Completed" | "Cancelled";

export interface AmcVisitStaffSummary {
  id: string;
  fullName: string;
}

export interface IAmcVisit {
  id?: string;
  amcId: string;
  scheduledDate: Date;
  status: AmcVisitStatus;
  notes?: string;
  assignedStaffIds?: string[];
  assignedStaff?: AmcVisitStaffSummary[];
  smrId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
