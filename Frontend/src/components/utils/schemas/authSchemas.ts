import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
  enableMFA: z.boolean().optional(),
});

// Backend registration schema - matches what the API expects
export const registrationSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
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
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phoneNumber: z
      .string()
      .min(6, "Please enter a valid phone number")
      .optional()
      .or(z.literal("")),
    profilePicture: z.instanceof(FileList).optional(),
    userType: z.enum(["Administrator", "User", "Manager", "Analyst"]),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
    enableMFA: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Frontend-specific registration schema for the form
export const frontendRegistrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
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
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phoneNumber: z
      .string()
      .min(6, "Please enter a valid phone number")
      .optional()
      .or(z.literal("")),
    profilePicture: z.instanceof(FileList).optional(),
    userType: z.enum(["Administrator", "User", "Manager", "Analyst"]),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
    enableMFA: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const twoFASchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type FrontendRegistrationFormData = z.infer<
  typeof frontendRegistrationSchema
>;
export type TwoFAFormData = z.infer<typeof twoFASchema>;
