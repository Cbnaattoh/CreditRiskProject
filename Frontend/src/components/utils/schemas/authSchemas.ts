import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be at most 50 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  rememberMe: z.boolean().optional(),
  enableMFA: z.boolean().optional()
});

export const twoFASchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type TwoFAFormData = z.infer<typeof twoFASchema>;
