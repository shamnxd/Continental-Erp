export interface Schedule {
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
  scheduledDate: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Pending" | "In Progress";
  assignedStaffIds: string[];
  assignedTo: string[];
  notes?: string;
  smrId?: string | null;
  completedAt?: string | null;
  completionNotes?: string;
  completionAttachment?: {
    name: string;
    url: string;
    mimeType: string;
    size: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}
