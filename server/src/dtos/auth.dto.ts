import { z } from "zod";

// Request DTO Schema (Zod)
export const LoginRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

// Response DTO Interface
export interface UserSessionDto {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: {
    crm: boolean;
    operations: boolean;
    finance: boolean;
    administration: boolean;
  };
}

export interface LoginResponseDto {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: UserSessionDto;
}
