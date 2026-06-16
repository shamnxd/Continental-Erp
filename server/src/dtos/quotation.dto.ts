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
  convertedTo: z.object({
    targetType: z.enum(["project", "amc", "minorjob"]),
    targetId: z.string(),
  }).optional(),
});

export type CreateQuotationDto = z.infer<typeof CreateQuotationSchema>;

export const UpdateQuotationSchema = CreateQuotationSchema.partial().extend({
  items: z.array(lineItemSchema).min(1).optional(),
});

export type UpdateQuotationDto = z.infer<typeof UpdateQuotationSchema>;

export const ConvertQuotationSchema = z.object({
  targetType: z.enum(["project", "amc", "minorjob"]),
  data: z.object({
    // project fields
    name: z.string().optional(),
    startDate: z.string().optional(),
    value: z.number().optional(),
    expectedCompletionDate: z.string().optional(),
    // amc fields
    startDateAmc: z.string().optional(),
    endDateAmc: z.string().optional(),
    frequency: z.enum(["Monthly", "Quarterly", "Bi-Annual", "Annual"]).optional(),
    serviceType: z.string().optional(),
    notes: z.string().optional(),
    // minor job fields
    description: z.string().optional(),
    scheduledDate: z.string().optional(),
    assignedTo: z.string().optional(),
    assignedStaffId: z.string().optional(),
    clientContact: z.string().optional(),
  })
});

export type ConvertQuotationDto = z.infer<typeof ConvertQuotationSchema>;
