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
  ssnitNumber?: string;
  gender: string;
  maritalStatus: string;

  // Contact Details
  phone: string;
  email: string;
  residentialAddress: string;
  digitalAddress: string;
  region: string;
  city: string;
  landmark?: string;
  postalCode?: string;

  // Employment
  employmentStatus: string;
  occupation?: string;
  employer?: string;
  yearsEmployed?: number;

  // Financials
  annualIncome: number;
  collections12mo?: number;
  dti: number;
  loanAmount: number;
  interestRate: number;
  creditHistoryLength: number;
  revolvingUtilization?: number;
  maxBankcardBalance?: number;
  delinquencies2yr?: number;
  totalAccounts: number;
  inquiries6mo?: number;
  revolvingAccounts12mo?: number;
  employmentLength: string;
  publicRecords?: number;
  openAccounts?: number;
  homeOwnership: string;
};

export type FormErrors = {
  [key in keyof FormData]?: FieldError;
};

export type MapLocation = {
  lat: number;
  lng: number;
};

export type GhanaRegion = {
  cities: string[];
  capital: string;
  area: string;
  population: string;
  coordinates: MapLocation;
  zoom: number;
};
