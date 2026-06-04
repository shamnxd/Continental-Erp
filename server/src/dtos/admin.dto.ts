import { z } from "zod";

export const CreateAdminSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be at most 50 characters long"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  permissions: z.object({
    crm: z.boolean().default(true),
    operations: z.boolean().default(true),
    finance: z.boolean().default(true),
    administration: z.boolean().default(true),
  }).default({
    crm: true,
    operations: true,
    finance: true,
    administration: true,
  }),
});

export type CreateAdminDto = z.infer<typeof CreateAdminSchema>;

export const UpdateAdminSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be at most 50 characters long")
    .optional(),
  email: z.string().email("Please provide a valid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  permissions: z.object({
    crm: z.boolean(),
    operations: z.boolean(),
    finance: z.boolean(),
    administration: z.boolean(),
  }).optional(),
});

export type UpdateAdminDto = z.infer<typeof UpdateAdminSchema>;
