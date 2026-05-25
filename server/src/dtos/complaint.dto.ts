import { z } from "zod";

export const CreateRemarkSchema = z.object({
  user: z.string().min(1, "User is required"),
  date: z.string().optional().or(z.date()).default(() => new Date()),
  text: z.string().min(1, "Text is required")
});

export const CreateComplaintSchema = z.object({
  date: z.string().transform(val => new Date(val)).or(z.date()).optional().default(() => new Date()),
  clientId: z.string().min(1, "Client ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(1, "Phone number is required"),
  issue: z.string().min(1, "Issue is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional().default("Medium"),
  status: z.enum(["Pending", "In Progress", "Resolved"]).optional().default("Pending"),
  assignedTo: z.union([z.string(), z.array(z.string())]).transform(val => typeof val === "string" ? (val.trim() ? [val.trim()] : []) : val).optional().default([]),
  location: z.string().min(1, "Location is required"),
  expectedResolution: z.string().transform(val => new Date(val)).or(z.date()),
  remarks: z.array(CreateRemarkSchema).optional().default([])
});

export type CreateComplaintDto = z.infer<typeof CreateComplaintSchema>;

export const UpdateComplaintSchema = CreateComplaintSchema.partial().extend({
  remarks: z.array(CreateRemarkSchema).optional()
});

export type UpdateComplaintDto = z.infer<typeof UpdateComplaintSchema>;
