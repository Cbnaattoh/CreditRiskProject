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
  ml_assessment?: MLCreditAssessment;
}

export interface ApplicationListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: CreditApplication[];
}

export interface MLCreditAssessment {
  id?: number;
  application: string;
  credit_score: number;
  category: string;
  risk_level: string;
  confidence: number;
  ghana_job_category?: string;
  ghana_employment_score?: number;
  ghana_job_stability_score?: number;
  model_version: string;
  prediction_timestamp: string;
  model_accuracy: number;
  confidence_factors?: Record<string, any>;
  processing_time_ms?: number;
  features_used?: string[];
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  processing_error?: string;
  retry_count: number;
  last_updated: string;
}

export interface UserMLAssessmentSummary {
  latest_assessment?: MLCreditAssessment;
  total_assessments: number;
  average_credit_score?: number;
  risk_level_distribution: Record<string, number>;
  assessment_history: MLCreditAssessment[];
}

// New interfaces for application tracking and reviews
export interface ApplicationReview {
  id: number;
  application: string;
  reviewer: string;
  reviewer_name: string;
  application_reference: string;
  review_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
  decision?: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  risk_assessment_score?: number;
  creditworthiness_rating?: string;
  general_remarks?: string;
  strengths?: string;
  concerns?: string;
  recommendation?: string;
  additional_info_required?: string;
  documents_required?: string[];
  review_started_at?: string;
  review_completed_at?: string;
  estimated_processing_days?: number;
  requires_second_opinion: boolean;
  second_reviewer?: string;
  second_review_comments?: string;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
  review_duration?: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export interface ApplicationStatusHistory {
  id: number;
  application: string;
  previous_status?: string;
  new_status: string;
  status_display: {
    previous?: string;
    new: string;
  };
  changed_by?: string;
  changed_by_name: string;
  changed_at: string;
  reason?: string;
  system_generated: boolean;
}

export interface ApplicationActivity {
  id: number;
  application: string;
  activity_type: string;
  activity_display: string;
  user?: string;
  user_name: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ApplicationComment {
  id: number;
  application: string;
  author?: string;
  author_name: string;
  author_role: string;
  comment_type: 'INTERNAL' | 'CLIENT_VISIBLE' | 'CLIENT_MESSAGE' | 'SYSTEM';
  comment_type_display: string;
  content: string;
  parent_comment?: number;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
  read_by?: string;
  attachment?: string;
  replies: ApplicationComment[];
}

export interface ReviewCompletionData {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  remarks?: string;
  risk_assessment_score?: number;
  creditworthiness_rating?: string;
  strengths?: string;
  concerns?: string;
  recommendation?: string;
  additional_info_required?: string;
  documents_required?: string[];
}

export interface ApplicationDashboard {
  stats: {
    total_applications: number;
    pending_review: number;
    under_review: number;
    approved: number;
    rejected: number;
    needs_info: number;
  };
  recent_applications: {
    id: string;
    reference_number: string;
    status: string;
    submission_date: string;
    applicant_name: string;
    loan_amount: string;
  }[];
  overdue_reviews: {
    application_id: string;
    reference_number: string;
    days_overdue: number;
  }[];
}

export interface MLProcessingStatistics {
  overview: {
    total_applications: number;
    with_ml_assessments: number;
    without_ml_assessments: number;
    coverage_percentage: number;
  };
  processing_status: Record<string, number>;
  performance: {
    recent_processing_24h: number;
    average_processing_time_ms: number;
    failed_assessments: number;
    success_rate: number;
  };
  score_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  last_updated: string;
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

    // Delete application (soft delete)
    deleteApplication: builder.mutation<{ detail: string }, string>({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Application'],
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

    // Get ML assessment for specific application
    getApplicationMLAssessment: builder.query<MLCreditAssessment, string>({
      query: (applicationId) => `${applicationId}/ml-assessment/`,
      providesTags: (result, error, applicationId) => [{ type: 'Application', id: applicationId }],
    }),

    // Get user's ML assessment summary (latest assessment and history)
    getUserMLAssessmentSummary: builder.query<UserMLAssessmentSummary, void>({
      query: () => 'my-ml-assessments/',
      providesTags: ['Application'],
    }),

    // Get ML processing statistics (admin/analyst only)
    getMLProcessingStatistics: builder.query<MLProcessingStatistics, void>({
      query: () => 'ml-assessments/statistics/',
      providesTags: ['Application'],
    }),

    // Application Review Management
    getApplicationReviews: builder.query<ApplicationReview[], string>({
      query: (applicationId) => `${applicationId}/reviews/`,
      providesTags: (result, error, applicationId) => [
        { type: 'Application', id: applicationId },
        'Review'
      ],
    }),

    getAllReviews: builder.query<ApplicationReview[], void>({
      query: () => 'reviews/',
      providesTags: ['Review'],
    }),

    createApplicationReview: builder.mutation<ApplicationReview, { applicationId: string; reviewData: Partial<ApplicationReview> }>({
      query: ({ applicationId, reviewData }) => ({
        url: `${applicationId}/reviews/`,
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Review'
      ],
    }),

    updateApplicationReview: builder.mutation<ApplicationReview, { reviewId: number; reviewData: Partial<ApplicationReview> }>({
      query: ({ reviewId, reviewData }) => ({
        url: `reviews/${reviewId}/`,
        method: 'PATCH',
        body: reviewData,
      }),
      invalidatesTags: ['Review'],
    }),

    startReview: builder.mutation<{ message: string; review_id: number; estimated_completion: number }, { applicationId: string; estimatedDays?: number }>({
      query: ({ applicationId, estimatedDays }) => ({
        url: `${applicationId}/start-review/`,
        method: 'POST',
        body: estimatedDays ? { estimated_days: estimatedDays } : {},
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Review'
      ],
    }),

    completeReview: builder.mutation<{ message: string; decision: string; application_status: string }, { applicationId: string; completionData: ReviewCompletionData }>({
      query: ({ applicationId, completionData }) => ({
        url: `${applicationId}/complete-review/`,
        method: 'POST',
        body: completionData,
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Review'
      ],
    }),

    // Application Status and Activity Tracking
    getApplicationStatusHistory: builder.query<ApplicationStatusHistory[], string>({
      query: (applicationId) => `${applicationId}/status-history/`,
      providesTags: (result, error, applicationId) => [
        { type: 'Application', id: applicationId }
      ],
    }),

    getApplicationActivities: builder.query<ApplicationActivity[], string>({
      query: (applicationId) => `${applicationId}/activities/`,
      providesTags: (result, error, applicationId) => [
        { type: 'Application', id: applicationId }
      ],
    }),

    // Application Comments/Communication
    getApplicationComments: builder.query<ApplicationComment[], string>({
      query: (applicationId) => `${applicationId}/comments/`,
      providesTags: (result, error, applicationId) => [
        { type: 'Application', id: applicationId },
        'Comment'
      ],
    }),

    verifyDocument: builder.mutation<Document, { applicationId: string; documentId: number; verified?: boolean; verificationNotes?: string }>({
      query: ({ applicationId, documentId, verified = true, verificationNotes = '' }) => ({
        url: `${applicationId}/documents/${documentId}/verify/`,
        method: 'PATCH',
        body: {
          verified,
          verification_notes: verificationNotes,
        },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Document'
      ],
    }),

    addApplicationComment: builder.mutation<ApplicationComment, { applicationId: string; content: string; commentType?: 'INTERNAL' | 'CLIENT_VISIBLE' | 'CLIENT_MESSAGE'; parentCommentId?: number }>({
      query: ({ applicationId, content, commentType, parentCommentId }) => ({
        url: `${applicationId}/comments/`,
        method: 'POST',
        body: {
          content,
          comment_type: commentType,
          parent_comment: parentCommentId,
        },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        'Comment'
      ],
    }),

    // Risk Analyst Dashboard
    getApplicationDashboard: builder.query<ApplicationDashboard, void>({
      query: () => 'dashboard/',
      providesTags: ['Application', 'Review'],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useSubmitApplicationMutation,
  useUploadDocumentMutation,
  useGetApplicationDocumentsQuery,
  useAddApplicationNoteMutation,
  useGetApplicationNotesQuery,
  useGetApplicationMLAssessmentQuery,
  useGetUserMLAssessmentSummaryQuery,
  useGetMLProcessingStatisticsQuery,
  // New hooks for application tracking and reviews
  useGetApplicationReviewsQuery,
  useGetAllReviewsQuery,
  useCreateApplicationReviewMutation,
  useUpdateApplicationReviewMutation,
  useStartReviewMutation,
  useCompleteReviewMutation,
  useGetApplicationStatusHistoryQuery,
  useGetApplicationActivitiesQuery,
  useGetApplicationCommentsQuery,
  useAddApplicationCommentMutation,
  useVerifyDocumentMutation,
  useGetApplicationDashboardQuery,
} = applicationsApi;