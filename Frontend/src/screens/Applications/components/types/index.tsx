import type { FieldError } from "react-hook-form";

export type FormStep = {
  label: string;
  isActive: boolean;
  description?: string;
};

export type UploadedFile = File & {
  id: string;
  uploadDate: Date;
  status?: "uploading" | "completed" | "failed";
};

export type FormData = {
  // Personal Info
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob: string;
  nationalIDNumber: string;
  gender: string;
  maritalStatus: string;

  // Contact Details
  phone: string;
  email: string;
  residentialAddress: string;
  digitalAddress: string;

  // Employment
  employmentStatus: string;
  occupation?: string;
  employer?: string;
  yearsEmployed?: number;

  // Financials
  annualIncome: number;
  otherIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
};

export type FormErrors = {
  [key in keyof FormData]?: FieldError;
};
