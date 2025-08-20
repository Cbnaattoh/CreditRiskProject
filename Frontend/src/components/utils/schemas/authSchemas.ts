import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
  enableMFA: z.boolean().optional(),
});

// Backend registration schema
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
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone_number: z
      .string()
      .min(6, "Please enter a valid phone number")
      .optional()
      .or(z.literal("")),
    profile_picture: z.instanceof(FileList).optional(),
    user_type: z.enum(["CLIENT", "AUDITOR", "ANALYST"]),
    terms_accepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
    mfa_enabled: z.boolean().optional(),
    ghana_card_number: z
      .string()
      .min(1, "Ghana Card number is required")
      .regex(/^GHA-\d{9}-\d$/, "Invalid format. Use: GHA-725499847-1 (GHA-9digits-1digit)"),
    ghana_card_front_image: z.instanceof(FileList).refine(
      (files) => files && files.length > 0,
      "Ghana Card front image is required"
    ),
    ghana_card_back_image: z.instanceof(FileList).refine(
      (files) => files && files.length > 0,
      "Ghana Card back image is required"
    ),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

// Frontend-specific registration schema for the form
export const frontendRegistrationSchema = z
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
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone_number: z
      .string()
      .min(6, "Please enter a valid phone number")
      .optional()
      .or(z.literal("")),
    profile_picture: z.instanceof(FileList).optional(),
    user_type: z.enum(["CLIENT", "AUDITOR", "ANALYST"]),
    terms_accepted: z.boolean().optional(),
    mfa_enabled: z.boolean().optional(),
    ghana_card_number: z
      .string()
      .min(1, "Ghana Card number is required")
      .regex(/^GHA-\d{9}-\d$/, "Invalid format. Use: GHA-725499847-1 (GHA-9digits-1digit)"),
    ghana_card_front_image: z.instanceof(FileList).refine(
      (files) => files && files.length > 0,
      "Ghana Card front image is required"
    ),
    ghana_card_back_image: z.instanceof(FileList).refine(
      (files) => files && files.length > 0,
      "Ghana Card back image is required"
    ),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  })
  .refine((data) => data.terms_accepted === true, {
    message: "You must accept the terms and conditions",
    path: ["terms_accepted"],
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
