import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

// Environment-based API root
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types for progressive validation
export interface ValidationResponse {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  suggestions?: Record<string, string>;
  field_scores?: Record<string, number>;
  processing_time_ms?: number;
}

export interface Step1ValidationRequest {
  email: string;
  phone_number: string;
  terms_accepted: boolean;
}

export interface Step2ValidationRequest {
  first_name: string;
  last_name: string;
  ghana_card_number: string;
}

export interface TextractProcessingRequest {
  ghana_card_front_image: File;
  ghana_card_back_image: File;
  first_name: string;
  last_name: string;
  ghana_card_number: string;
}

export interface TextractProcessingResponse {
  success: boolean;
  verification_status: 'success' | 'warning' | 'error' | 'processing';
  results: {
    extracted_name: string | null;
    extracted_number: string | null;
    name_verified: boolean;
    number_verified: boolean;
    confidence: number;
    similarity_score: number;
    message: string;
    detailed_analysis?: {
      name_components: string[];
      card_number_segments: string[];
      textract_quality_score: number;
      image_quality_assessment: {
        front_image: { clarity: number; brightness: number; contrast: number };
        back_image: { clarity: number; brightness: number; contrast: number };
      };
    };
  };
  errors: string[];
  processing_time_ms: number;
  recommendations?: string[];
}

export interface Step4ValidationRequest {
  password: string;
  confirm_password: string;
  mfa_enabled?: boolean;
}

export interface PasswordStrengthResponse {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  password_strength: {
    score: number;
    level: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
    estimated_crack_time: string;
    suggestions: string[];
  };
  security_recommendations?: string[];
}

export interface VerificationCodeRequest {
  type: 'email' | 'phone';
  contact_info: string;
}

export interface VerificationCodeResponse {
  success: boolean;
  message: string;
  otp_sent: boolean;
  expires_in_seconds?: number;
  demo_otp?: string;
}

export interface CodeVerificationRequest {
  type: 'email' | 'phone';
  code: string;
  contact_info: string;
}

export interface CodeVerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
  error?: string;
}

// Base query with retry logic and error handling
const baseQueryWithRetry: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  fetchBaseQuery({
    baseUrl: `${BASE_URL}/auth/`,
    credentials: 'include',
    prepareHeaders: (headers, { getState, endpoint }) => {
      const isFormDataEndpoint = endpoint === 'processGhanaCardTextract' || endpoint === 'completeRegistration';

      if (!isFormDataEndpoint) {
        headers.set('Content-Type', 'application/json');
      }

      headers.set('X-Request-ID', crypto.randomUUID());

      headers.set('X-Request-Timestamp', Date.now().toString());

      headers.set('Cache-Control', 'no-cache');

      headers.set('Accept-Encoding', 'gzip, deflate, br');

      return headers;
    },
    timeout: 30000,
  }),
  {
    maxRetries: 3,
    retryCondition: (error, args, extraOptions) => {
      return error.status === 'FETCH_ERROR' ||
        error.status === 'TIMEOUT_ERROR' ||
        (typeof error.status === 'number' && error.status >= 500);
    },
    retryDelay: (attempt, args, baseQuery) => {
      return Math.min(1000 * Math.pow(2, attempt), 8000);
    },
  }
);

// Performance optimization and monitoring
class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }

    const durations = this.metrics.get(endpoint)!;
    durations.push(duration);

    if (durations.length > 10) {
      durations.shift();
    }
  }

  static getAverageTime(endpoint: string): number {
    const durations = this.metrics.get(endpoint) || [];
    if (durations.length === 0) return 0;

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  static isSlowEndpoint(endpoint: string): boolean {
    return this.getAverageTime(endpoint) > 3000;
  }
}

const performanceMonitoringBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const startTime = performance.now();
    const endpoint = typeof args === 'string' ? args : args.url;

    try {
      const result = await baseQueryWithRetry(args, api, extraOptions);
      const endTime = performance.now();
      const duration = endTime - startTime;

      PerformanceMonitor.recordMetric(endpoint, duration);

      const logLevel = duration > 5000 ? 'error' : duration > 2000 ? 'warn' : 'log';
      console[logLevel](`[API] ${endpoint}: ${duration.toFixed(2)}ms (avg: ${PerformanceMonitor.getAverageTime(endpoint).toFixed(2)}ms)`);

      if (result.meta) {
        result.meta.performanceMs = duration;
        result.meta.averageMs = PerformanceMonitor.getAverageTime(endpoint);
        result.meta.isSlowEndpoint = PerformanceMonitor.isSlowEndpoint(endpoint);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error(`[API Error] ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);

      // Record failed request metrics
      PerformanceMonitor.recordMetric(`${endpoint}_error`, duration);

      throw error;
    }
  };

// Create the registration API
export const registrationApi = createApi({
  reducerPath: 'registrationApi',
  baseQuery: performanceMonitoringBaseQuery,
  tagTypes: ['ValidationCache', 'TextractResult'],
  endpoints: (builder) => ({

    // Step 1: Basic Information Validation
    validateStep1: builder.mutation<ValidationResponse, Step1ValidationRequest>({
      query: (data) => ({
        url: 'register/validate/step1/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ValidationCache'],
      transformResponse: (response: ValidationResponse) => {
        return {
          ...response,
          client_timestamp: Date.now(),
          validation_version: '2.0',
        };
      },
    }),

    // Step 2: Identity Validation with Real-time Checks
    validateStep2: builder.mutation<ValidationResponse, Step2ValidationRequest>({
      query: (data) => ({
        url: 'register/validate/step2/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ValidationCache'],
      transformResponse: (response: ValidationResponse) => {
        return {
          ...response,
          client_timestamp: Date.now(),
          validation_version: '2.0',
        };
      },
    }),

    // Step 3: Ghana Card AWS Textract Processing  
    processGhanaCardTextract: builder.mutation<TextractProcessingResponse, FormData>({
      query: (formData) => ({
        url: 'register/validate/ghana-card/',
        method: 'POST',
        body: formData,
        headers: {},
      }),
      invalidatesTags: ['TextractResult'],
      transformResponse: (response: TextractProcessingResponse) => {
        return {
          ...response,
          client_timestamp: Date.now(),
          textract_version: '1.0',
        };
      },
      transformErrorResponse: (response: FetchBaseQueryError) => {
        return {
          status: response.status,
          error: response.data || 'Textract processing failed',
          timestamp: Date.now(),
        };
      },
    }),

    // Step 4: Security Validation
    validateStep4: builder.mutation<PasswordStrengthResponse, Step4ValidationRequest>({
      query: (data) => ({
        url: 'register/validate/step4/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ValidationCache'],
      transformResponse: (response: PasswordStrengthResponse) => {
        return {
          ...response,
          client_timestamp: Date.now(),
          security_version: '2.0',
        };
      },
    }),

    // Verification Code Sending
    sendVerificationCode: builder.mutation<VerificationCodeResponse, VerificationCodeRequest>({
      query: (data) => ({
        url: 'register/verification/send/',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: VerificationCodeResponse) => {
        return {
          ...response,
          client_timestamp: Date.now(),
          expires_at: response.expires_in_seconds
            ? Date.now() + (response.expires_in_seconds * 1000)
            : undefined,
        };
      },
    }),

    // Code Verification
    verifyCode: builder.mutation<CodeVerificationResponse, CodeVerificationRequest>({
      query: (data) => ({
        url: 'register/verification/verify/',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: CodeVerificationResponse) => {
        return {
          ...response,
          client_timestamp: Date.now(),
          verification_version: '2.0',
        };
      },
    }),

    // Complete Registration - Final submission after all validations
    completeRegistration: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: 'register/',
        method: 'POST',
        body: formData,
        headers: {},
      }),
      invalidatesTags: ['ValidationCache', 'TextractResult'],
      transformResponse: (response: any) => ({
        ...response,
        client_timestamp: Date.now(),
        registration_version: '2.0',
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        error: response.data || 'Registration failed',
        timestamp: Date.now(),
      }),
    }),


    checkEmailAvailability: builder.query<{ available: boolean; suggestions?: string[] }, string>({
      query: (email) => `register/check-email/?email=${encodeURIComponent(email)}`,
      keepUnusedDataFor: 300,
      providesTags: (result, error, email) => [
        { type: 'ValidationCache', id: `email_${email}` },
      ],
      transformResponse: (response: any) => ({
        ...response,
        cachedAt: Date.now(),
      }),
    }),

    // Ghana Card Number Format Validation with regional caching
    validateGhanaCardFormat: builder.query<{ valid: boolean; formatted?: string; region?: string }, string>({
      query: (cardNumber) => `register/validate-ghana-card/?number=${encodeURIComponent(cardNumber)}`,
      keepUnusedDataFor: 1800,
      providesTags: (result, error, cardNumber) => [
        { type: 'ValidationCache', id: `card_${cardNumber}` },
      ],
      transformResponse: (response: any) => ({
        ...response,
        cachedAt: Date.now(),
      }),
    }),

    // Password Strength Real-time Analysis with smart caching
    analyzePasswordStrength: builder.query<PasswordStrengthResponse['password_strength'], string>({
      query: (password) => ({
        url: 'register/analyze-password/',
        method: 'POST',
        body: { password },
      }),
      keepUnusedDataFor: 60,
      providesTags: (result, error, password) => [
        { type: 'ValidationCache', id: `password_${password?.length || 0}` },
      ],
      transformResponse: (response: any) => ({
        ...response,
        cachedAt: Date.now(),
      }),
    }),

  }),
});

export const {
  useValidateStep1Mutation,
  useValidateStep2Mutation,
  useProcessGhanaCardTextractMutation,
  useValidateStep4Mutation,
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useCompleteRegistrationMutation,
  useCheckEmailAvailabilityQuery,
  useLazyCheckEmailAvailabilityQuery,
  useValidateGhanaCardFormatQuery,
  useLazyValidateGhanaCardFormatQuery,
  useAnalyzePasswordStrengthQuery,
  useLazyAnalyzePasswordStrengthQuery,
} = registrationApi;


export class RegistrationAnalytics {
  private static events: Array<{
    type: string;
    data: any;
    timestamp: number;
    sessionId: string;
  }> = [];

  private static sessionId = crypto.randomUUID();

  static trackEvent(type: string, data: any) {
    this.events.push({
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });

    if (this.events.length > 100) {
      this.events.shift();
    }

    console.log(`[Analytics] ${type}:`, data);
  }

  static trackValidationStart(step: number) {
    this.trackEvent('validation_start', { step, timestamp: Date.now() });
  }

  static trackValidationComplete(step: number, success: boolean, duration: number) {
    this.trackEvent('validation_complete', {
      step,
      success,
      duration,
      timestamp: Date.now()
    });
  }

  static trackTextractStart() {
    this.trackEvent('textract_start', { timestamp: Date.now() });
  }

  static trackTextractComplete(success: boolean, confidence: number, duration: number) {
    this.trackEvent('textract_complete', {
      success,
      confidence,
      duration,
      timestamp: Date.now()
    });
  }

  static trackRegistrationStart() {
    this.trackEvent('registration_start', { timestamp: Date.now() });
  }

  static trackRegistrationComplete(success: boolean, duration: number) {
    this.trackEvent('registration_complete', {
      success,
      duration,
      timestamp: Date.now()
    });
  }

  static trackError(error: any, context: string) {
    this.trackEvent('error', {
      message: error?.message || 'Unknown error',
      status: error?.status,
      context,
      timestamp: Date.now()
    });
  }

  static getSessionSummary() {
    const validationEvents = this.events.filter(e => e.type.includes('validation'));
    const textractEvents = this.events.filter(e => e.type.includes('textract'));
    const errorEvents = this.events.filter(e => e.type === 'error');

    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      validationAttempts: validationEvents.length,
      textractAttempts: textractEvents.length,
      errors: errorEvents.length,
      sessionDuration: Date.now() - (this.events[0]?.timestamp || Date.now()),
      events: this.events,
    };
  }

  static exportAnalytics() {
    return {
      summary: this.getSessionSummary(),
      performanceMetrics: PerformanceMonitor,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }
}


export class RegistrationService {
  static createTextractFormData(
    frontImage: File,
    backImage: File,
    personalInfo: { first_name: string; last_name: string; ghana_card_number: string }
  ): FormData {
    const formData = new FormData();

    formData.append('ghana_card_front_image', frontImage);
    formData.append('ghana_card_back_image', backImage);
    formData.append('first_name', personalInfo.first_name);
    formData.append('last_name', personalInfo.last_name);
    formData.append('ghana_card_number', personalInfo.ghana_card_number);

    formData.append('client_timestamp', Date.now().toString());
    formData.append('textract_version', '1.0');

    return formData;
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please upload a JPEG, PNG, or WebP image' };
    }


    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be smaller than 10MB' };
    }


    const minSize = 10 * 1024;
    if (file.size < minSize) {
      return { valid: false, error: 'Image file appears to be too small or corrupted' };
    }

    return { valid: true };
  }

  static formatGhanaCardNumber(input: string): string {
    let cleaned = input.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();


    if (cleaned.startsWith('GHA')) {
      cleaned = cleaned.replace(/^GHA-?/, 'GHA');
      const digits = cleaned.substring(3).replace(/[^0-9]/g, '');

      if (digits.length >= 10) {
        return `GHA-${digits.substring(0, 9)}-${digits.charAt(9)}`;
      } else if (digits.length >= 3) {
        return `GHA-${digits}`;
      }
    }

    return cleaned;
  }


  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static translateErrorMessage(error: string | string[]): string {
    const errorStr = Array.isArray(error) ? error[0] : error;

    const errorMap: Record<string, string> = {
      'This field is required': 'This information is required to continue',
      'Invalid email address': 'Please enter a valid email address',
      'This email is already registered': 'An account with this email already exists',
      'Invalid Ghana Card format': 'Please enter your Ghana Card number in format: GHA-123456789-1',
      'Password too weak': 'Please create a stronger password with uppercase, numbers, and special characters',
      'Names do not match': 'The name on your Ghana Card doesn\'t match what you entered. Please check and try again.',
      'Textract processing failed': 'We couldn\'t read your Ghana Card clearly. Please try taking a clearer photo.',
    };

    return errorMap[errorStr] || errorStr;
  }
}

export default registrationApi;