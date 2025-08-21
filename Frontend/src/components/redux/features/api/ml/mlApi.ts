import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../store';

// Types based on ML API serializers
export interface MLPredictionInput {
  // Financial Information
  annual_income: number;
  loan_amount: number;
  interest_rate: number;
  debt_to_income_ratio: number;
  
  // Credit History Information
  credit_history_length: number;
  revolving_utilization?: number;
  max_bankcard_balance?: number;
  
  // Account Information
  total_accounts: number;
  open_accounts?: number;
  
  // Risk Factors
  delinquencies_2yr?: number;
  inquiries_6mo?: number;
  revolving_accounts_12mo?: number;
  public_records?: number;
  collections_12mo?: number;
  
  // Employment Information (Ghana-specific)
  employment_length: string;
  job_title: string;
  
  // Housing Information
  home_ownership: string;
}

export interface GhanaEmploymentAnalysis {
  job_title: string;
  job_category: string;
  employment_length: string;
  stability_score: number | string;
  job_stability_score: number | string;
  income_analysis: string | object;
}

export interface ModelInfo {
  version: string;
  accuracy: number;
  model_type: string;
  features_used: number;
  ghana_categories: number;
}

export interface MLPredictionOutput {
  success: boolean;
  credit_score?: number;
  category?: string;
  risk_level?: string;
  confidence?: number;
  ghana_employment_analysis?: GhanaEmploymentAnalysis;
  model_info?: ModelInfo;
  confidence_factors?: Record<string, any>;
  processing_time_ms?: number;
  prediction_timestamp?: string;
  request_id?: string;
  error?: string;
  validation_errors?: string[];
}

export interface BatchPredictionInput {
  predictions: MLPredictionInput[];
  include_detailed_analysis?: boolean;
}

export interface BatchPredictionResult {
  success: boolean;
  credit_score?: number;
  category?: string;
  risk_level?: string;
  confidence?: number;
  ghana_employment_analysis?: GhanaEmploymentAnalysis;
  confidence_factors?: Record<string, any>;
  batch_index: number;
  error?: string;
}

export interface BatchPredictionOutput {
  success: boolean;
  total_predictions: number;
  successful_predictions: number;
  failed_predictions: number;
  results: BatchPredictionResult[];
  processing_summary: {
    batch_id: string;
    processing_time_ms: number;
    average_time_per_prediction: number;
    success_rate: number;
  };
  batch_id: string;
  error?: string;
}

export interface MLModelHealth {
  status: string;
  model_loaded: boolean;
  accuracy: string;
  features_count: string;
  ghana_employment_categories: number;
  version: string;
  last_updated?: string;
  model_type: string;
  training_data: string;
  supported_predictions: string[];
  error?: string;
}

export interface MLDocumentation {
  api_version: string;
  model_info: {
    name: string;
    version: string;
    type: string;
    accuracy: string;
    specialization: string;
  };
  endpoints: Record<string, any>;
  required_fields: Record<string, string>;
  optional_fields: Record<string, string>;
  ghana_job_categories: string[];
  response_format: Record<string, any>;
  example_request: MLPredictionInput;
  example_response: MLPredictionOutput;
}

// ML API slice
export const mlApi = createApi({
  reducerPath: 'mlApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/ml/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['MLPrediction', 'MLHealth', 'MLDocs'],
  endpoints: (builder) => ({
    // Single credit score prediction
    predictCreditScore: builder.mutation<MLPredictionOutput, MLPredictionInput>({
      query: (data) => ({
        url: 'predict/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MLPrediction'],
    }),

    // Batch credit score predictions
    batchPredictCreditScores: builder.mutation<BatchPredictionOutput, BatchPredictionInput>({
      query: (data) => ({
        url: 'batch-predict/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MLPrediction'],
    }),

    // Model health check
    getModelHealth: builder.query<MLModelHealth, void>({
      query: () => 'health/',
      providesTags: ['MLHealth'],
    }),

    // API documentation
    getMLDocumentation: builder.query<MLDocumentation, void>({
      query: () => 'docs/',
      providesTags: ['MLDocs'],
    }),
  }),
});

export const {
  usePredictCreditScoreMutation,
  useBatchPredictCreditScoresMutation,
  useGetModelHealthQuery,
  useGetMLDocumentationQuery,
} = mlApi;

// Types are already exported as interfaces above