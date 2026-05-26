import { z } from "zod";

export const AddAmcRemarkSchema = z.object({
  text: z.string().min(1, "Remark text is required")
});

export type AddAmcRemarkDto = z.infer<typeof AddAmcRemarkSchema>;

export const RecordAmcPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["Advance", "Payment"]),
  note: z.string().optional().or(z.literal(""))
});

export type RecordAmcPaymentDto = z.infer<typeof RecordAmcPaymentSchema>;
