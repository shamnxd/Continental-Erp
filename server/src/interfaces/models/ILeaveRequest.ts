export type LeaveType = "Annual" | "Sick" | "Emergency" | "Unpaid" | "Other";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface ILeaveRequest {
  id?: string;
  staffId: string;
  staffName: string;
  staffNo: string;
  leaveType: LeaveType;
  fromDate: Date;
  toDate: Date;
  days: number;
  reason?: string;
  status: LeaveStatus;
  adminNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
