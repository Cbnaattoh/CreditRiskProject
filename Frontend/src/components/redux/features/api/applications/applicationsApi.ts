import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../store';

// Base URL for the API
const BASE_URL = 'http://localhost:8000/api';

// Types based on the backend models
export interface Address {
  id?: number;
  address_type: 'HOME' | 'WORK' | 'OTHER';
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
}

export interface EmploymentInfo {
  id?: number;
  employer_name: string;
  job_title: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
  start_date: string;
  end_date?: string;
  is_current: boolean;
  monthly_income: string;
  income_verified: boolean;
  verification_documents?: string;
}

export interface BankAccount {
  id?: number;
  account_type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'OTHER';
  bank_name: string;
  account_number: string;
  balance: string;
  is_primary: boolean;
}

export interface FinancialInfo {
  id?: number;
  total_assets: string;
  total_liabilities: string;
  monthly_expenses: string;
  has_bankruptcy: boolean;
  bankruptcy_details?: string;
  credit_score?: number;
  credit_score_last_updated?: string;
  bank_accounts?: BankAccount[];
}

export interface Applicant {
  id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O' | 'P';
  marital_status: 'S' | 'M' | 'D' | 'W';
  national_id: string;
  tax_id?: string;
  phone_number: string;
  alternate_phone?: string;
  email: string;
  addresses?: Address[];
  employment_history?: EmploymentInfo[];
  financial_info?: FinancialInfo;
}

export interface ApplicationDocument {
  id?: number;
  document_type: 'ID' | 'PROOF_OF_INCOME' | 'TAX_RETURN' | 'BANK_STATEMENT' | 'OTHER';
  file: File | string;
  uploaded_at?: string;
  verified: boolean;
  verification_notes?: string;
}

export interface ApplicationNote {
  id?: number;
  author_email?: string;
  note: string;
  created_at?: string;
  is_internal: boolean;
}

export interface RiskAssessment {
  id?: number;
  risk_score?: number;
  risk_rating?: string;
  probability_of_default?: number;
  expected_loss?: string;
  last_updated: string;
  review_notes?: string;
}

export interface RiskExplanation {
  id?: number;
  summary: string;
  key_factors: Record<string, any>;
  visualizations: Record<string, any>;
  generated_at: string;
}

export interface CreditApplication {
  id?: string;
  reference_number?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  status_display?: string;
  submission_date?: string;
  last_updated: string;
  assigned_analyst?: any;
  is_priority: boolean;
  notes?: string;
  applicant_info?: Applicant;
  documents?: ApplicationDocument[];
  additional_notes?: ApplicationNote[];
  risk_assessment?: RiskAssessment;
  risk_explanation?: RiskExplanation;
}

export interface ApplicationListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: CreditApplication[];
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

// File validation utility
export const validateFile = (file: File, documentType: string): FileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // File size validation (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // File type validation based on document type
  const allowedTypes: Record<string, string[]> = {
    'ID': ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    'PROOF_OF_INCOME': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'TAX_RETURN': ['application/pdf'],
    'BANK_STATEMENT': ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'OTHER': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  const allowed = allowedTypes[documentType] || allowedTypes['OTHER'];
  if (!allowed.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed for ${documentType}`);
  }
  
  // File name validation
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (suspiciousExtensions.includes(fileExtension)) {
    errors.push('File type not allowed for security reasons');
  }
  
  // Check for potential malicious patterns in filename
  const maliciousPatterns = [
    /[<>:"/\\|?*]/,  // Invalid filename characters
    /^\./,           // Hidden files
    /\.(bat|cmd|exe|scr|pif|com|vbs|js)$/i  // Executable files
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(file.name)) {
      errors.push('Invalid filename detected');
      break;
    }
  }
  
  // File age check (warn if file is too old)
  const fileAge = Date.now() - file.lastModified;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  if (fileAge > oneYearMs) {
    warnings.push('File appears to be over one year old');
  }
  
  // Empty file check
  if (file.size === 0) {
    errors.push('File is empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
  };
};

// Advanced file content validation
export const validateFileContent = async (file: File): Promise<FileValidationResult> => {
  const basicValidation = validateFile(file, 'OTHER');
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  const errors: string[] = [...basicValidation.errors];
  const warnings: string[] = [...basicValidation.warnings];
  
  try {
    // Read first few bytes to check file signature
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check for common file signatures
    const signatures: Record<string, number[]> = {
      'PDF': [0x25, 0x50, 0x44, 0x46], // %PDF
      'JPEG': [0xFF, 0xD8, 0xFF],
      'PNG': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'GIF': [0x47, 0x49, 0x46],
    };
    
    let signatureMatched = false;
    for (const [format, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        signatureMatched = true;
        
        // Verify file extension matches signature
        const extension = file.name.toLowerCase().split('.').pop();
        if (
          (format === 'PDF' && extension !== 'pdf') ||
          (format === 'JPEG' && !['jpg', 'jpeg'].includes(extension || '')) ||
          (format === 'PNG' && extension !== 'png') ||
          (format === 'GIF' && extension !== 'gif')
        ) {
          warnings.push('File extension does not match file content');
        }
        break;
      }
    }
    
    // If no signature matched and file claims to be an image/pdf, flag as suspicious
    if (!signatureMatched && ['image/', 'application/pdf'].some(type => file.type.startsWith(type))) {
      errors.push('File content does not match declared file type');
    }
    
  } catch (error) {
    warnings.push('Could not validate file content');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: basicValidation.fileInfo
  };
};

export const applicationsApi = createApi({
  reducerPath: 'applicationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/applications/`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Application', 'Document', 'Note', 'Risk'],
  endpoints: (builder) => ({
    // Get all applications (paginated) - Backend automatically filters by user role
    getApplications: builder.query<ApplicationListResponse, { page?: number; page_size?: number; status?: string }>({
      query: (params = {}) => ({
        url: '',
        params: {
          page: params.page || 1,
          page_size: params.page_size || 10,
          ...(params.status && { status: params.status })
        }
      }),
      providesTags: ['Application'],
    }),

    // Get single application
    getApplication: builder.query<CreditApplication, string>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Application', id }],
    }),

    // Create new application
    createApplication: builder.mutation<CreditApplication, Partial<CreditApplication>>({
      query: (newApplication) => ({
        url: '',
        method: 'POST',
        body: newApplication,
      }),
      invalidatesTags: ['Application'],
    }),

    // Update application
    updateApplication: builder.mutation<CreditApplication, { id: string; data: Partial<CreditApplication> }>({
      query: ({ id, data }) => ({
        url: `${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Application', id }],
    }),

    // Submit application
    submitApplication: builder.mutation<{ status: string }, { id: string; confirm: boolean }>({
      query: ({ id, confirm }) => ({
        url: `${id}/submit/`,
        method: 'POST',
        body: { confirm },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Application', id }],
    }),

    // Upload document
    uploadDocument: builder.mutation<ApplicationDocument, { applicationId: string; file: File; documentType: string }>({
      query: ({ applicationId, file, documentType }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        
        return {
          url: `${applicationId}/documents/`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Document'
      ],
    }),

    // Get application documents
    getApplicationDocuments: builder.query<ApplicationDocument[], string>({
      query: (applicationId) => `${applicationId}/documents/`,
      providesTags: ['Document'],
    }),

    // Add application note
    addApplicationNote: builder.mutation<ApplicationNote, { applicationId: string; note: string; isInternal: boolean }>({
      query: ({ applicationId, note, isInternal }) => ({
        url: `${applicationId}/notes/`,
        method: 'POST',
        body: { note, is_internal: isInternal },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Note'
      ],
    }),

    // Get application notes
    getApplicationNotes: builder.query<ApplicationNote[], string>({
      query: (applicationId) => `${applicationId}/notes/`,
      providesTags: ['Note'],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useSubmitApplicationMutation,
  useUploadDocumentMutation,
  useGetApplicationDocumentsQuery,
  useAddApplicationNoteMutation,
  useGetApplicationNotesQuery,
} = applicationsApi;