export interface IProjectTask {
  id?: string;
  projectRef: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Critical";
  assignedStaffId?: string;
  assignedTo?: string;
  dueDate?: Date | string;
  completedWorkNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
