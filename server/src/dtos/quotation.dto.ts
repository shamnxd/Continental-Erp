import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(0),
  rate: z.number().min(0),
  total: z.number().min(0).optional(),
  section: z.enum(["machine_side", "low_side"]).optional().default("machine_side"),
  unit: z.string().optional().default(""),
  group: z.string().optional(),
  isDescriptionOnly: z.boolean().optional(),
});

export const CreateQuotationSchema = z.object({
  quotationNo: z.string().optional(),
  date: z.string().transform((val) => new Date(val)).or(z.date()).optional().default(() => new Date()),
  validUntil: z.string().transform((val) => new Date(val)).or(z.date()),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  enquiryId: z.string().optional().default(""),
  enquiryNo: z.string().optional().default(""),
  gstPercent: z.number().min(0).max(100).optional().default(18),
  machineGstPercent: z.number().min(0).max(100).optional().default(28),
  lowSideGstPercent: z.number().min(0).max(100).optional().default(18),
  status: z
    .enum(["Draft", "Pending Approval", "Approved", "Rejected", "Expired"])
    .optional()
    .default("Pending Approval"),
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().optional().default(""),
  costingId: z.string().optional().default(""),
  costingRevision: z.number().optional(),
  clonedFromQuotationRevision: z.number().optional(),
  revision: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateQuotationDto = z.infer<typeof CreateQuotationSchema>;

export const UpdateQuotationSchema = CreateQuotationSchema.partial().extend({
  items: z.array(lineItemSchema).min(1).optional(),
});

export type UpdateQuotationDto = z.infer<typeof UpdateQuotationSchema>;
