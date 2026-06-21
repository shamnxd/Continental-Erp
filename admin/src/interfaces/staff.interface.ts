export type StaffEmploymentType = "Permanent" | "Temporary";
export type StaffStatus = "Available" | "On Site" | "On Leave" | "Inactive";

export const STAFF_ROLE_PRESETS = [
  "Senior Technician",
  "Technician",
  "Junior Technician",
  "Supervisor",
  "Engineer",
  "Helper",
  "Custom",
] as const;

export type StaffRolePreset = (typeof STAFF_ROLE_PRESETS)[number];

export interface Staff {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffWorkHistoryItem {
  complaintId: string;
  complaintNo: string;
  clientName: string;
  issue: string;
  status: string;
  priority: string;
  date: string;
  location: string;
}

export function getStaffDisplayRole(staff: Pick<Staff, "role" | "customRole">): string {
  return staff.role === "Custom" && staff.customRole ? staff.customRole : staff.role;
}

/** Staff who can be picked on complaints (assign / reassign). */
export function isStaffAssignable(staff: Pick<Staff, "isActive">): boolean {
  return staff.isActive !== false;
}

export function getStaffStatusLabel(staff: Pick<Staff, "isActive" | "status">): string {
  if (!staff.isActive) return "Unavailable";
  return staff.status;
}
