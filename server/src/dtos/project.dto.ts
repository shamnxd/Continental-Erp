import { z } from "zod";

export const CreateProjectSchema = z.object({
  clientRef: z.string().min(1, "Client reference is required"),
  name: z.string().min(1, "Project name is required"),
  startDate: z.string().transform((val) => new Date(val)).or(z.date()).optional().default(() => new Date()),
  value: z.number().min(0, "Project value must be positive"),
  quotationRef: z.string().optional(),
  expectedCompletionDate: z.string().transform((val) => new Date(val)).or(z.date()).optional()
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: z.enum(["Planning", "Active", "On Hold", "Completed"]).optional(),
  actualCompletionDate: z.string().transform((val) => new Date(val)).or(z.date()).optional(),
  handoverDocs: z.array(z.object({
    name: z.string(),
    url: z.string(),
    storageKey: z.string().optional(),
    uploadedBy: z.string(),
    uploadedDate: z.string().transform((val) => new Date(val)).or(z.date()).optional()
  })).optional()
});

export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;
export interface GetProjectsQueryDto {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}
