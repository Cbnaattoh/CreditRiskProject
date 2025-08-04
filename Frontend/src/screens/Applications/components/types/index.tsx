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
  category?: string;
};

// Enhanced form data structure aligned with backend
export type FormData = {
  // Personal Info (aligned with backend Applicant model)
  firstName: string;
  lastName: string;
  otherNames?: string;  // Maps to middle_name
  dob: string;          // Maps to date_of_birth
  nationalIDNumber: string;  // Maps to national_id
  ssnitNumber?: string;      // Maps to tax_id
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';  // Maps to M/F/O/P
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';  // Maps to S/M/D/W

  // Contact Details
  phone: string;        // Maps to phone_number
  alternatePhone?: string;  // Maps to alternate_phone
  email: string;
  residentialAddress: string;  // Maps to street_address
  digitalAddress?: string;     // Ghana specific
  region: string;              // Maps to state_province
  city: string;
  landmark?: string;
  postalCode?: string;

  // Employment Information
  employmentStatus: 'employed' | 'unemployed' | 'self_employed' | 'retired';
  occupation?: string;     // Maps to job_title
  employer?: string;       // Maps to employer_name
  yearsEmployed?: number;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
  employmentStartDate?: string;
  isCurrentEmployment?: boolean;

  // Financial Information
  annualIncome: number;
  monthlyIncome?: number;      // Maps to monthly_income in employment
  totalAssets?: number;        // Maps to total_assets
  totalLiabilities?: number;   // Maps to total_liabilities
  monthlyExpenses?: number;    // Maps to monthly_expenses
  
  // Credit and Risk Factors
  collections12mo?: number;
  dti: number;  // Debt to income ratio
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
  homeOwnership: 'own' | 'rent' | 'mortgage' | 'other';
  
  // Bankruptcy Information
  hasBankruptcy?: boolean;
  bankruptcyDetails?: string;
  
  // Bank Account Information
  bankAccounts?: Array<{
    accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'OTHER';
    bankName: string;
    balance: number;
    isPrimary: boolean;
  }>;
};

// Backend API types (exact match with backend models)
export type BackendApplicantData = {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O' | 'P';
  marital_status: 'S' | 'M' | 'D' | 'W';
  national_id: string;
  tax_id?: string;
  phone_number: string;
  alternate_phone?: string;
  email: string;
  addresses?: Array<{
    address_type: 'HOME' | 'WORK' | 'OTHER';
    street_address: string;
    city: string;
    state_province: string;
    postal_code?: string;
    country: string;
    is_primary: boolean;
  }>;
  employment_history?: Array<{
    employer_name: string;
    job_title: string;
    employment_type: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
    start_date: string;
    end_date?: string;
    is_current: boolean;
    monthly_income: string;
    income_verified: boolean;
  }>;
  financial_info?: {
    total_assets: string;
    total_liabilities: string;
    monthly_expenses: string;
    has_bankruptcy: boolean;
    bankruptcy_details?: string;
    credit_score?: number;
    bank_accounts?: Array<{
      account_type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'OTHER';
      bank_name: string;
      account_number: string;
      balance: string;
      is_primary: boolean;
    }>;
  };
};

export type BackendApplicationData = {
  applicant_info: BackendApplicantData;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  is_priority: boolean;
  notes?: string;
};

export type FormErrors = {
  [key in keyof FormData]?: FieldError;
};

// Enhanced error handling
export type ApiError = {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  applicant_info?: Record<string, string[]>;
};

export type FormSubmissionResult = {
  success: boolean;
  data?: any;
  error?: ApiError;
  validationErrors?: FormErrors;
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

// Form validation types
export type ValidationRule = {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => string | boolean;
};

export type FormValidationSchema = {
  [K in keyof FormData]?: ValidationRule;
};

// Transformation utilities
export class FormDataTransformer {
  static toBackendFormat(formData: FormData): BackendApplicationData {
    // Transform frontend form data to backend API format
    const genderMap: Record<string, 'M' | 'F' | 'O' | 'P'> = {
      'male': 'M',
      'female': 'F',
      'other': 'O',
      'prefer_not_to_say': 'P'
    };
    
    const maritalStatusMap: Record<string, 'S' | 'M' | 'D' | 'W'> = {
      'single': 'S',
      'married': 'M',
      'divorced': 'D',
      'widowed': 'W'
    };
    
    const employmentTypeMap: Record<string, 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED'> = {
      'employed': 'FULL_TIME',
      'unemployed': 'UNEMPLOYED',
      'self_employed': 'SELF_EMPLOYED',
      'retired': 'RETIRED'
    };
    
    return {
      applicant_info: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.otherNames,
        date_of_birth: formData.dob,
        gender: genderMap[formData.gender] || 'O',
        marital_status: maritalStatusMap[formData.maritalStatus] || 'S',
        national_id: formData.nationalIDNumber,
        tax_id: formData.ssnitNumber,
        phone_number: formData.phone,
        alternate_phone: formData.alternatePhone,
        email: formData.email,
        addresses: [{
          address_type: 'HOME' as const,
          street_address: formData.residentialAddress,
          city: formData.city,
          state_province: formData.region,
          postal_code: formData.postalCode || '',
          country: 'Ghana',
          is_primary: true
        }],
        employment_history: formData.employmentStatus ? [{
          employer_name: formData.employer || '',
          job_title: formData.occupation || '',
          employment_type: employmentTypeMap[formData.employmentStatus] || 'UNEMPLOYED',
          start_date: formData.employmentStartDate || new Date().toISOString().split('T')[0],
          is_current: formData.isCurrentEmployment ?? true,
          monthly_income: String(formData.monthlyIncome || (formData.annualIncome / 12)),
          income_verified: false
        }] : [],
        financial_info: {
          total_assets: String(formData.totalAssets || formData.annualIncome || 0),
          total_liabilities: String(formData.totalLiabilities || 0),
          monthly_expenses: String(formData.monthlyExpenses || ((formData.annualIncome || 0) * (formData.dti || 0.3) / 12)),
          has_bankruptcy: formData.hasBankruptcy || false,
          bankruptcy_details: formData.bankruptcyDetails,
          // credit_score will be calculated by the AI system
          bank_accounts: formData.bankAccounts?.map(account => ({
            account_type: account.accountType,
            bank_name: account.bankName,
            account_number: '****', // Placeholder for security
            balance: String(account.balance),
            is_primary: account.isPrimary
          })) || []
        }
      },
      status: 'SUBMITTED' as const,
      is_priority: false,
      notes: `Application submitted by ${formData.firstName} ${formData.lastName}`,
      
      // Loan Application Fields
      loan_amount: formData.loanAmount,
      interest_rate: formData.interestRate,
      credit_history_length: formData.creditHistoryLength,
      revolving_utilization: formData.revolvingUtilization,
      max_bankcard_balance: formData.maxBankcardBalance,
      delinquencies_2yr: formData.delinquencies2yr,
      total_accounts: formData.totalAccounts,
      inquiries_6mo: formData.inquiries6mo,
      revolving_accounts_12mo: formData.revolvingAccounts12mo,
      employment_length: formData.employmentLength,
      public_records: formData.publicRecords,
      open_accounts: formData.openAccounts,
      home_ownership: formData.homeOwnership,
      collections_12mo: formData.collections12mo,
      annual_income: formData.annualIncome,
      debt_to_income_ratio: formData.dti
    };
  }
  
  static fromBackendFormat(backendData: BackendApplicationData): Partial<FormData> {
    // Transform backend data to frontend form format
    const applicant = backendData.applicant_info;
    const address = applicant.addresses?.[0];
    const employment = applicant.employment_history?.[0];
    const financial = applicant.financial_info;
    
    const genderMap: Record<string, string> = {
      'M': 'male',
      'F': 'female',
      'O': 'other',
      'P': 'prefer_not_to_say'
    };
    
    const maritalStatusMap: Record<string, string> = {
      'S': 'single',
      'M': 'married',
      'D': 'divorced',
      'W': 'widowed'
    };
    
    return {
      firstName: applicant.first_name,
      lastName: applicant.last_name,
      otherNames: applicant.middle_name,
      dob: applicant.date_of_birth,
      gender: genderMap[applicant.gender] as any,
      maritalStatus: maritalStatusMap[applicant.marital_status] as any,
      nationalIDNumber: applicant.national_id,
      ssnitNumber: applicant.tax_id,
      phone: applicant.phone_number,
      alternatePhone: applicant.alternate_phone,
      email: applicant.email,
      residentialAddress: address?.street_address || '',
      city: address?.city || '',
      region: address?.state_province || '',
      postalCode: address?.postal_code,
      employer: employment?.employer_name,
      occupation: employment?.job_title,
      monthlyIncome: employment ? parseFloat(employment.monthly_income) : 0,
      annualIncome: employment ? parseFloat(employment.monthly_income) * 12 : 0,
      totalAssets: financial ? parseFloat(financial.total_assets) : 0,
      totalLiabilities: financial ? parseFloat(financial.total_liabilities) : 0,
      monthlyExpenses: financial ? parseFloat(financial.monthly_expenses) : 0,
      hasBankruptcy: financial?.has_bankruptcy,
      bankruptcyDetails: financial?.bankruptcy_details,
      bankAccounts: financial?.bank_accounts?.map(account => ({
        accountType: account.account_type,
        bankName: account.bank_name,
        balance: parseFloat(account.balance),
        isPrimary: account.is_primary
      }))
    };
  }
}