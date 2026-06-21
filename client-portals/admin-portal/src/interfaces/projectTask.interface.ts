export interface ProjectTask {
  id?: string;
  projectRef: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Critical";
  assignedStaffId?: string;
  assignedTo?: string;
  dueDate?: string;
  completedWorkNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}
