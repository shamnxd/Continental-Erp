import { z } from "zod";

const roleEnum = z.enum([
  "Senior Technician",
  "Technician",
  "Junior Technician",
  "Supervisor",
  "Engineer",
  "Helper",
  "Custom"
]);

const StaffBaseSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  city: z.string().min(1, "City is required"),
  role: roleEnum,
  customRole: z.string().optional().or(z.literal("")),
  employmentType: z.enum(["Permanent", "Outsource"]).default("Permanent"),
  specialization: z.string().optional().or(z.literal("")),
  status: z.enum(["Available", "On Site", "On Leave", "Inactive"]).default("Available"),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true)
});

const customRoleRefine = (data: { role: string; customRole?: string }) =>
  data.role !== "Custom" || (data.customRole && data.customRole.trim().length > 0);

export const CreateStaffSchema = StaffBaseSchema.refine(customRoleRefine, {
  message: "Custom role name is required when role is Custom",
  path: ["customRole"]
});

export type CreateStaffDto = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = StaffBaseSchema.partial().refine(
  (data) => !data.role || customRoleRefine({ role: data.role, customRole: data.customRole }),
  { message: "Custom role name is required when role is Custom", path: ["customRole"] }
);

export type UpdateStaffDto = z.infer<typeof UpdateStaffSchema>;
