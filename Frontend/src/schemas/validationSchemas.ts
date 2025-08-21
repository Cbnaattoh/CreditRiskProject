import { z } from 'zod';

// Helper regex patterns for Ghana-specific validation
const GHANA_PHONE_REGEX = /^(\+233)[2-9]\d{8}$/;
const GHANA_NATIONAL_ID_REGEX = /^GHA-\d{9}-\d$/;
const GHANA_SSNIT_REGEX = /^P\d{10}$/;
const GHANA_DIGITAL_ADDRESS_REGEX = /^[A-Z]{2}-\d{3,4}-\d{3,4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Custom validation messages
const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid Ghana phone number (e.g.,+233202344444)',
  nationalId: 'Please enter a valid Ghana National ID (format: GHA-XXXXXXXXX-X)',
  ssnit: 'Please enter a valid SSNIT number (format: PXXXXXXXXXX)',
  digitalAddress: 'Please enter a valid Ghana Post GPS address (format: GE-123-4567)',
  minAge: 'Applicant must be at least 18 years old',
  maxAge: 'Please enter a valid date of birth',
  positiveNumber: 'This value must be a positive number',
  percentage: 'This value must be between 0 and 100',
  futureDate: 'Date cannot be in the future',
};

// Date validation helpers
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Custom Zod refinements
const dateOfBirthValidation = z
  .string()
  .min(1, VALIDATION_MESSAGES.required)
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate <= today;
  }, VALIDATION_MESSAGES.futureDate)
  .refine((date) => {
    const age = calculateAge(date);
    return age >= 18;
  }, VALIDATION_MESSAGES.minAge)
  .refine((date) => {
    const age = calculateAge(date);
    return age <= 100;
  }, VALIDATION_MESSAGES.maxAge);

// Personal Information Schema
const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  otherNames: z
    .string()
    .max(100, 'Other names must not exceed 100 characters')
    .regex(/^[a-zA-Z\s\-']*$/, 'Other names can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  
  dob: dateOfBirthValidation,
  
  nationalIDNumber: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .regex(GHANA_NATIONAL_ID_REGEX, VALIDATION_MESSAGES.nationalId),
  
  ssnitNumber: z
    .string()
    .regex(GHANA_SSNIT_REGEX, VALIDATION_MESSAGES.ssnit)
    .optional(),
  
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    errorMap: () => ({ message: 'Please select a marital status' }),
  }),
});

// Contact Information Schema
const contactInfoSchema = z.object({
  phone: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .regex(GHANA_PHONE_REGEX, VALIDATION_MESSAGES.phone),
  
  alternatePhone: z
    .string()
    .regex(GHANA_PHONE_REGEX, VALIDATION_MESSAGES.phone)
    .optional()
    .or(z.literal('')),
  
  email: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .regex(EMAIL_REGEX, VALIDATION_MESSAGES.email)
    .max(100, 'Email must not exceed 100 characters'),
  
  residentialAddress: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .min(3, 'Address must be at least 3 characters')
    .max(200, 'Address must not exceed 200 characters'),
  
  digitalAddress: z
    .string()
    .regex(GHANA_DIGITAL_ADDRESS_REGEX, VALIDATION_MESSAGES.digitalAddress)
    .optional()
    .or(z.literal('')),
  
  region: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .max(50, 'Region must not exceed 50 characters'),
  
  city: z
    .string()
    .min(1, VALIDATION_MESSAGES.required)
    .max(50, 'City must not exceed 50 characters'),
  
  landmark: z
    .string()
    .max(100, 'Landmark must not exceed 100 characters')
    .optional(),
  
  postalCode: z
    .string()
    .max(10, 'Postal code must not exceed 10 characters')
    .optional(),
});

// Employment Information Schema
const employmentInfoSchema = z.object({
  employmentStatus: z.enum(['employed', 'unemployed', 'self_employed', 'retired'], {
    errorMap: () => ({ message: 'Please select an employment status' }),
  }),
  
  occupation: z
    .string()
    .max(100, 'Occupation must not exceed 100 characters')
    .optional(),
  
  jobTitle: z
    .string()
    .min(1, 'Job title is required')
    .max(100, 'Job title must not exceed 100 characters'),
  
  employer: z
    .string()
    .max(100, 'Employer name must not exceed 100 characters')
    .optional(),
  
  yearsEmployed: z
    .number()
    .min(0, 'Years employed cannot be negative')
    .max(50, 'Years employed cannot exceed 50')
    .optional(),
  
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED'])
    .optional(),
  
  employmentStartDate: z
    .string()
    .optional(),
  
  isCurrentEmployment: z
    .boolean()
    .optional(),
  

});

// Financial Information Schema
const financialInfoSchema = z.object({
  annualIncome: z
    .number()
    .min(0, VALIDATION_MESSAGES.positiveNumber)
    .max(10000000, 'Annual income seems unusually high'),
  
  monthlyIncome: z
    .number()
    .min(0, VALIDATION_MESSAGES.positiveNumber)
    .optional(),
  
  totalAssets: z
    .number()
    .min(0, VALIDATION_MESSAGES.positiveNumber)
    .optional(),
  
  totalLiabilities: z
    .number()
    .min(0, VALIDATION_MESSAGES.positiveNumber)
    .optional(),
  
  monthlyExpenses: z
    .number()
    .min(0, VALIDATION_MESSAGES.positiveNumber)
    .optional(),
  
  loanAmount: z
    .number()
    .min(100, 'Loan amount must be at least ₵100')
    .max(10000000, 'Loan amount cannot exceed ₵10,000,000'),
  
  interestRate: z
    .number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  
  dti: z
    .number()
    .min(0, VALIDATION_MESSAGES.percentage)
    .max(100, VALIDATION_MESSAGES.percentage),
  
  homeOwnership: z.enum(['OWN', 'RENT', 'MORTGAGE', 'OTHER'], {
    errorMap: () => ({ message: 'Please select home ownership status' }),
  }),
});

// Credit and Risk Factors Schema
const creditRiskSchema = z.object({
  creditHistoryLength: z
    .number()
    .min(0, 'Credit history length cannot be negative')
    .max(50, 'Credit history length cannot exceed 50 years'),
  
  revolvingUtilization: z
    .number()
    .min(0, VALIDATION_MESSAGES.percentage)
    .max(100, VALIDATION_MESSAGES.percentage),
  
  maxBankcardBalance: z
    .number()
    .min(0, VALIDATION_MESSAGES.positiveNumber),
  
  delinquencies2yr: z
    .number()
    .int('Number of delinquencies must be a whole number')
    .min(0, 'Number of delinquencies cannot be negative')
    .max(50, 'Number of delinquencies seems unusually high'),
  
  totalAccounts: z
    .number()
    .int('Total accounts must be a whole number')
    .min(0, 'Total accounts cannot be negative')
    .max(100, 'Total accounts seems unusually high'),
  
  inquiries6mo: z
    .number()
    .int('Number of inquiries must be a whole number')
    .min(0, 'Number of inquiries cannot be negative')
    .max(50, 'Number of inquiries seems unusually high'),
  
  revolvingAccounts12mo: z
    .number()
    .int('Number of revolving accounts must be a whole number')
    .min(0, 'Number of revolving accounts cannot be negative')
    .max(50, 'Number of revolving accounts seems unusually high'),
  
  publicRecords: z
    .number()
    .int('Number of public records must be a whole number')
    .min(0, 'Number of public records cannot be negative')
    .max(20, 'Number of public records seems unusually high'),
  
  openAccounts: z
    .number()
    .int('Number of open accounts must be a whole number')
    .min(0, 'Number of open accounts cannot be negative')
    .max(100, 'Number of open accounts seems unusually high'),
  
  collections12mo: z
    .number()
    .int('Number of collections must be a whole number')
    .min(0, 'Number of collections cannot be negative'),
});

// Bankruptcy Information Schema
const bankruptcyInfoSchema = z.object({
  hasBankruptcy: z.string().optional(),
  
  bankruptcyDetails: z
    .string()
    .max(500, 'Bankruptcy details must not exceed 500 characters')
    .optional(),
});

// Bank Account Schema
const bankAccountSchema = z.object({
  accountType: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'OTHER'], {
    errorMap: () => ({ message: 'Please select an account type' }),
  }).optional(),

  bankName: z
    .string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name must not exceed 100 characters')
    .optional(),
  
  balance: z
    .number()
    .min(0, 'Account balance cannot be negative'),
  
  isPrimary: z.boolean()
  .optional(),
});

const bankAccountsSchema = z.object({
  bankAccounts: z.array(bankAccountSchema).optional(),
});

// Complete Form Data Schema
export const loanApplicationSchema = z.object({
  ...personalInfoSchema.shape,
  ...contactInfoSchema.shape,
  ...employmentInfoSchema.shape,
  ...financialInfoSchema.shape,
  ...creditRiskSchema.shape,
  ...bankruptcyInfoSchema.shape,
  ...bankAccountsSchema.shape,
});

// Step-specific schemas for validation
export const personalInfoStepSchema = z.object({
  ...personalInfoSchema.shape,
  ...contactInfoSchema.shape,
});

export const employmentStepSchema = employmentInfoSchema;

export const financialStepSchema = z.object({
  ...financialInfoSchema.shape,
  ...creditRiskSchema.shape,
  ...bankruptcyInfoSchema.shape,
  ...bankAccountsSchema.shape,
});

// Type inference from schemas
export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
export type PersonalInfoStepData = z.infer<typeof personalInfoStepSchema>;
export type EmploymentStepData = z.infer<typeof employmentStepSchema>;
export type FinancialStepData = z.infer<typeof financialStepSchema>;

// Utility function to get validation errors in react-hook-form format
export const formatZodErrors = (error: z.ZodError) => {
  const formatted: Record<string, { message: string; type: string }> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = {
      message: err.message,
      type: 'validation',
    };
  });
  
  return formatted;
};

// Validation functions for each step
export const validatePersonalInfoStep = (data: any) => {
  try {
    personalInfoStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: formatZodErrors(error) };
    }
    return { isValid: false, errors: { general: { message: 'Validation failed', type: 'validation' } } };
  }
};

export const validateEmploymentStep = (data: any) => {
  try {
    employmentStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: formatZodErrors(error) };
    }
    return { isValid: false, errors: { general: { message: 'Validation failed', type: 'validation' } } };
  }
};

export const validateFinancialStep = (data: any) => {
  try {
    financialStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: formatZodErrors(error) };
    }
    return { isValid: false, errors: { general: { message: 'Validation failed', type: 'validation' } } };
  }
};

export const validateCompleteForm = (data: any) => {
  try {
    loanApplicationSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: formatZodErrors(error) };
    }
    return { isValid: false, errors: { general: { message: 'Validation failed', type: 'validation' } } };
  }
};

// Export individual schemas for use with react-hook-form resolvers
export {
  personalInfoSchema,
  contactInfoSchema,
  employmentInfoSchema,
  financialInfoSchema,
  creditRiskSchema,
  bankruptcyInfoSchema,
  bankAccountSchema,
};