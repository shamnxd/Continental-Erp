import { z } from "zod";

export const CreateMinorJobSchema = z.object({
  clientRef: z.string().min(1, "Client reference is required"),
  description: z.string().min(1, "Description is required"),
  scheduledDate: z.string().transform((val) => new Date(val)).or(z.date()).optional().default(() => new Date()),
  assignedTo: z.string().optional().default(""),
  assignedStaffId: z.string().optional().default(""),
  quotationRef: z.string().optional()
});

export type CreateMinorJobDto = z.infer<typeof CreateMinorJobSchema>;

export const UpdateMinorJobSchema = CreateMinorJobSchema.partial().extend({
  status: z.enum(["Open", "In Progress", "Completed"]).optional()
});

export type UpdateMinorJobDto = z.infer<typeof UpdateMinorJobSchema>;

export interface GetMinorJobsQueryDto {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}
