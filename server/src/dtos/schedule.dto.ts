import { z } from "zod";

export const CreateScheduleSchema = z.object({
  entityType: z.enum(["enquiry", "complaint", "amc", "project", "minorjob"]),
  entityId: z.string().min(1, "Entity ID is required"),
  entityNo: z.string().min(1, "Entity number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientRef: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required"),
  scheduleType: z.enum([
    "Follow-up",
    "Schedule Visit",
    "Enquiry Visit",
    "AMC Visit",
    "Complaint Resolution",
    "Project Installation",
    "Minor Job",
  ]),
  scheduledDate: z
    .string()
    .transform((val) => new Date(val))
    .or(z.date()),
  status: z
    .enum(["Scheduled", "Completed", "Cancelled", "Pending", "In Progress"])
    .optional()
    .default("Scheduled"),
  assignedStaffIds: z.array(z.string()).optional().default([]),
  assignedTo: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === "string" ? (val.trim() ? [val.trim()] : []) : val))
    .optional()
    .default([]),
  notes: z.string().optional().default(""),
  smrId: z.string().nullable().optional(),
  completedAt: z
    .string()
    .transform((val) => (val ? new Date(val) : null))
    .or(z.date())
    .nullable()
    .optional(),
  completionNotes: z.string().optional(),
  completionAttachment: z
    .object({
      name: z.string(),
      url: z.string(),
      mimeType: z.string(),
      size: z.number(),
    })
    .nullable()
    .optional(),
});

export type CreateScheduleDto = z.infer<typeof CreateScheduleSchema>;

export const UpdateScheduleSchema = CreateScheduleSchema.partial();

export type UpdateScheduleDto = z.infer<typeof UpdateScheduleSchema>;
export type GetSchedulesQuery = {
  entityType?: "enquiry" | "complaint" | "amc" | "project" | "minorjob";
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
};
