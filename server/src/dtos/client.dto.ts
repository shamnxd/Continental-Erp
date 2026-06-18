import { z } from "zod";

export const CreateClientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please provide a valid email address"),
  gst: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  address: z.string().optional().or(z.literal("")),
  projectsCount: z.number().optional().default(0),
  amcStatus: z.enum(["Active", "Inactive", "Expired"]).optional().default("Inactive"),
  parentCompany: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal(""))
});

export type CreateClientDto = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = CreateClientSchema.partial();

export type UpdateClientDto = z.infer<typeof UpdateClientSchema>;
