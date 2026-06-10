export interface ISchedule {
  id?: string;
  entityType: "enquiry" | "complaint" | "amc" | "project" | "minorjob";
  entityId: string;
  entityNo: string;
  clientName: string;
  clientRef?: string | null;
  title: string;
  scheduleType:
    | "Follow-up"
    | "Schedule Visit"
    | "Enquiry Visit"
    | "AMC Visit"
    | "Complaint Resolution"
    | "Project Installation"
    | "Minor Job";
  scheduledDate: Date | string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Pending" | "In Progress";
  assignedStaffIds: string[];
  assignedTo: string[];
  notes?: string;
  smrId?: string | null;
  completedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
