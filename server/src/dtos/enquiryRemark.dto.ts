import { z } from "zod";

export const AddEnquiryRemarkSchema = z.object({
  text: z.string().min(1, "Remark text is required"),
});

export type AddEnquiryRemarkDto = z.infer<typeof AddEnquiryRemarkSchema>;

export const EditEnquiryRemarkSchema = z.object({
  text: z.string().min(1, "Remark text is required"),
});

export type EditEnquiryRemarkDto = z.infer<typeof EditEnquiryRemarkSchema>;
