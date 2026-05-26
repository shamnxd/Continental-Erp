import { z } from "zod";

export const ScheduleAmcVisitSchema = z.object({
  scheduledDate: z.string().min(1, "Visit date is required"),
  notes: z.string().optional().or(z.literal("")),
  assignedStaffIds: z.array(z.string()).optional().default([])
});

export type ScheduleAmcVisitDto = z.infer<typeof ScheduleAmcVisitSchema>;

export const UpdateAmcVisitSchema = z.object({
  status: z.enum(["Scheduled", "Completed", "Cancelled"]).optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional().or(z.literal("")),
  assignedStaffIds: z.array(z.string()).optional(),
  smrId: z.string().optional().or(z.literal(""))
});

export type UpdateAmcVisitDto = z.infer<typeof UpdateAmcVisitSchema>;
