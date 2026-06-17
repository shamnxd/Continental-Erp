import { z } from "zod";

export const REMARK_ENTITY_TYPES = [
  "enquiry",
  "complaint",
  "complaint_request",
  "amc",
  "project",
  "minorjob",
  "warranty",
  "quotation",
  "subcontract",
  "purchase_order",
  "schedule",
] as const;

export const AddRemarkSchema = z.object({
  entityType: z.enum(REMARK_ENTITY_TYPES),
  entityId: z.string().min(1, "Entity ID is required"),
  text: z.string().min(1, "Remark text is required"),
  parentRemarkId: z.string().nullable().optional(),
});

export type AddRemarkDto = z.infer<typeof AddRemarkSchema>;
