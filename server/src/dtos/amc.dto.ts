import { z } from "zod";

const frequencyEnum = z.enum(["Monthly", "Quarterly", "Bi-Annual", "Annual"]);

const AmcBaseSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  frequency: frequencyEnum,
  amount: z.coerce.number().min(0).optional().default(0),
  totalVisits: z.coerce.number().int().min(1).optional(),
  overrideTotalVisits: z.boolean().optional().default(false),
  serviceType: z.string().min(1, "Service type is required"),
  nextVisit: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  renewalOfAmcId: z.string().optional().or(z.literal(""))
});

const dateRangeRefine = (data: { startDate: string; endDate: string }) =>
  new Date(data.endDate) >= new Date(data.startDate);

export const CreateAmcSchema = AmcBaseSchema.refine(dateRangeRefine, {
  message: "End date must be on or after start date",
  path: ["endDate"]
});

export type CreateAmcDto = z.infer<typeof CreateAmcSchema>;

export const UpdateAmcSchema = AmcBaseSchema.partial().refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return dateRangeRefine({ startDate: data.startDate, endDate: data.endDate });
  },
  { message: "End date must be on or after start date", path: ["endDate"] }
);

export type UpdateAmcDto = z.infer<typeof UpdateAmcSchema>;
