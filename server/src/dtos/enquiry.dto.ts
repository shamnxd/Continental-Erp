import { z } from "zod";

const drawingSchema = z.object({
  name: z.string().min(1),
  uploadDate: z
    .string()
    .transform((val) => new Date(val))
    .or(z.date())
    .optional()
    .default(() => new Date()),
  uploadedBy: z.string().min(1),
});

export const CreateEnquirySchema = z.object({
  date: z.string().transform((val) => new Date(val)).or(z.date()).optional().default(() => new Date()),
  clientId: z.string().min(1, "Client ID is required"),
  clientName: z.string().optional().default(""),
  contactPerson: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.union([z.string().email(), z.literal("")]).optional().default(""),
  requirement: z.string().min(1, "Requirement is required"),
  description: z.string().min(1, "Description is required"),
  status: z
    .enum([
      "Site Visit Scheduled",
      "Quotation Prepared",
      "Follow-up Required",
      "Converted to Project",
      "Closed",
    ])
    .optional()
    .default("Follow-up Required"),
  priority: z.enum(["High", "Medium", "Low"]).optional().default("Medium"),
  assignedTo: z.string().optional().default(""),
  assignedStaffId: z.string().optional().default(""),
  followUpDate: z
    .string()
    .transform((val) => (val ? new Date(val) : null))
    .or(z.date())
    .nullable()
    .optional()
    .default(null),
  drawings: z.array(drawingSchema).optional().default([]),
});

export type CreateEnquiryDto = z.infer<typeof CreateEnquirySchema>;

export const UpdateEnquirySchema = CreateEnquirySchema.partial();

export type UpdateEnquiryDto = z.infer<typeof UpdateEnquirySchema>;
