import { z } from "zod";

export const CreateWarrantySchema = z.object({
  clientRef: z.string().min(1, "Client reference is required"),
  projectRef: z.string().optional().nullable(),
  product: z.string().min(1, "Product description is required"),
  startDate: z.string().transform((val) => new Date(val)).or(z.date()),
  endDate: z.string().transform((val) => new Date(val)).or(z.date()),
  status: z.enum(["Active", "Expiring Soon", "Expired", "Claimed"]).default("Active"),
  remarks: z.string().optional()
});

export type CreateWarrantyDto = z.infer<typeof CreateWarrantySchema>;

export const UpdateWarrantySchema = CreateWarrantySchema.partial();

export type UpdateWarrantyDto = z.infer<typeof UpdateWarrantySchema>;

export interface GetWarrantiesQueryDto {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  projectId?: string;
}
