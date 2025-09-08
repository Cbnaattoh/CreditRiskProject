import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../store';

// Base URL for the API
const BASE_URL = 'http://localhost:8000/api';

export interface RiskFactor {
  id?: number;
  factor_name: string;
  factor_weight: number;
  factor_score: number;
  notes?: string;
  weighted_score?: number;
}

export interface RiskAssessment {
  id?: number;
  application: string;
  risk_score?: number;
  risk_rating?: string;
  probability_of_default?: number;
  expected_loss?: string;
  last_updated: string;
  reviewed_by?: any;
  review_notes?: string;
  risk_factors?: RiskFactor[];
}

export interface ModelPrediction {
  id?: number;
  application: string;
  model_version: string;
  prediction_date: string;
  prediction: Record<string, any>;
  confidence: number;
  explanation?: string;
}

export interface RiskExplanation {
  id?: number;
  application: string;
  summary: string;
  key_factors: Record<string, any>;
  visualizations: Record<string, any>;
  generated_at: string;
  primary_factors?: Array<[string, any]>;
}

export interface CounterfactualExplanation {
  id?: number;
  application: string;
  scenario: string;
  original_score: number;
  projected_score: number;
  probability_change: number;
  required_changes: Record<string, any>;
  explanation: string;
  created_at: string;
  score_change?: number;
  improvement_percentage?: number;
}

export interface Decision {
  id?: number;
  application: string;
  decision: 'APPROVE' | 'DECLINE' | 'REFER' | 'CONDITIONAL';
  decision_date: string;
  decision_by?: any;
  amount_approved?: string;
  interest_rate?: number;
  term_months?: number;
  conditions?: string;
  notes?: string;
}

export interface CreditScore {
  id?: number;
  applicant: number;
  score_type: 'FICO' | 'VANTAGE' | 'INTERNAL';
  score: number;
  report_date: string;
  provider: string;
  factors: Record<string, any>;
}

export interface RiskAnalysisData {
  risk_assessment?: RiskAssessment;
  risk_explanation?: RiskExplanation;
  model_predictions?: ModelPrediction[];
  counterfactuals?: CounterfactualExplanation[];
  credit_scores?: CreditScore[];
  decision?: Decision;
}

export interface RiskAnalyticsDashboardData {
  risk_analyst: {
    risk_assessments: {
      count: number;
      change_percentage: number;
      trend: 'up' | 'down' | 'neutral';
    };
    high_risk_cases: {
      count: number;
      change_percentage: number;
      trend: 'up' | 'down' | 'neutral';
    };
    model_accuracy: {
      percentage: number;
      change_percentage: number;
      trend: 'up' | 'down' | 'neutral';
    };
    pending_reviews: {
      count: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
  };
  compliance_auditor: {
    compliance_score: {
      percentage: number;
      change_percentage: number;
      trend: 'up' | 'down' | 'neutral';
    };
    audit_findings: {
      count: number;
      change_percentage: number;
      trend: 'up' | 'down' | 'neutral';
    };
    policy_violations: {
      count: number;
      change_percentage: number;
      trend: 'up' | 'down' | 'neutral';
    };
    regulatory_reports: {
      count: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
  };
  last_updated: string;
}

export interface RiskChartsData {
  risk_distribution: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
    icon: string;
    description: string;
  }>;
  credit_score_distribution: Array<{
    range: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
    icon: string;
    description: string;
  }>;
  risk_factors_radar: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
  compliance_violations_trend: Array<{
    month: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolved: number;
    compliance_score: number;
    audit_findings: number;
    policy_violations: number;
    regulatory_breaches: number;
  }>;
  credit_statistics: {
    avg_score: number;
    total_apps: number;
    total_ml_assessments: number;
    prime_plus_percentage: number;
    vs_target: number;
  };
  compliance_statistics: {
    avg_compliance: number;
    total_violations: number;
    critical_issues: number;
    resolution_rate: number;
  };
  last_updated: string;
  data_sources: {
    total_applications: number;
    ml_assessments: number;
    risk_assessments: number;
  };
}

export const riskApi = createApi({
  reducerPath: 'riskApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/risk/`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['RiskAssessment', 'RiskExplanation', 'ModelPrediction', 'CounterfactualExplanation', 'Decision'],
  endpoints: (builder) => ({
    // Get risk assessment for application
    getRiskAssessment: builder.query<RiskAssessment, string>({
      query: (applicationId) => `assessments/${applicationId}/`,
      providesTags: (result, error, applicationId) => [{ type: 'RiskAssessment', id: applicationId }],
    }),

    // Create/Update risk assessment
    createRiskAssessment: builder.mutation<RiskAssessment, { applicationId: string; data: Partial<RiskAssessment> }>({
      query: ({ applicationId, data }) => ({
        url: `assessments/`,
        method: 'POST',
        body: { application: applicationId, ...data },
      }),
      invalidatesTags: (result, error, { applicationId }) => [{ type: 'RiskAssessment', id: applicationId }],
    }),

    // Update risk assessment
    updateRiskAssessment: builder.mutation<RiskAssessment, { id: number; data: Partial<RiskAssessment> }>({
      query: ({ id, data }) => ({
        url: `assessments/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'RiskAssessment', id: id.toString() }],
    }),

    // Get risk explanation for application
    getRiskExplanation: builder.query<RiskExplanation, string>({
      query: (applicationId) => `explanations/${applicationId}/`,
      providesTags: (result, error, applicationId) => [{ type: 'RiskExplanation', id: applicationId }],
    }),

    // Generate risk explanation
    generateRiskExplanation: builder.mutation<RiskExplanation, string>({
      query: (applicationId) => ({
        url: `explanations/generate/`,
        method: 'POST',
        body: { application: applicationId },
      }),
      invalidatesTags: (result, error, applicationId) => [{ type: 'RiskExplanation', id: applicationId }],
    }),

    // Get model predictions for application
    getModelPredictions: builder.query<ModelPrediction[], string>({
      query: (applicationId) => `predictions/?application=${applicationId}`,
      providesTags: ['ModelPrediction'],
    }),

    // Generate new prediction
    generatePrediction: builder.mutation<ModelPrediction, { applicationId: string; modelVersion?: string }>({
      query: ({ applicationId, modelVersion }) => ({
        url: `predictions/generate/`,
        method: 'POST',
        body: { 
          application: applicationId,
          ...(modelVersion && { model_version: modelVersion })
        },
      }),
      invalidatesTags: ['ModelPrediction'],
    }),

    // Get counterfactual explanations
    getCounterfactualExplanations: builder.query<CounterfactualExplanation[], string>({
      query: (applicationId) => `counterfactuals/?application=${applicationId}`,
      providesTags: ['CounterfactualExplanation'],
    }),

    // Generate counterfactual explanation
    generateCounterfactual: builder.mutation<CounterfactualExplanation, { applicationId: string; scenario: string }>({
      query: ({ applicationId, scenario }) => ({
        url: `counterfactuals/generate/`,
        method: 'POST',
        body: { 
          application: applicationId,
          scenario 
        },
      }),
      invalidatesTags: ['CounterfactualExplanation'],
    }),

    // Get decision for application
    getDecision: builder.query<Decision, string>({
      query: (applicationId) => `decisions/${applicationId}/`,
      providesTags: (result, error, applicationId) => [{ type: 'Decision', id: applicationId }],
    }),

    // Create decision
    createDecision: builder.mutation<Decision, { applicationId: string; data: Partial<Decision> }>({
      query: ({ applicationId, data }) => ({
        url: `decisions/`,
        method: 'POST',
        body: { application: applicationId, ...data },
      }),
      invalidatesTags: (result, error, { applicationId }) => [{ type: 'Decision', id: applicationId }],
    }),

    // Get comprehensive risk analysis data
    getRiskAnalysis: builder.query<RiskAnalysisData, string>({
      query: (applicationId) => `analysis/${applicationId}/`,
      providesTags: (result, error, applicationId) => [
        { type: 'RiskAssessment', id: applicationId },
        { type: 'RiskExplanation', id: applicationId },
        { type: 'Decision', id: applicationId },
      ],
    }),

    // Run complete risk analysis
    runRiskAnalysis: builder.mutation<RiskAnalysisData, { applicationId: string; options?: Record<string, any> }>({
      query: ({ applicationId, options = {} }) => ({
        url: `analysis/run/`,
        method: 'POST',
        body: { 
          application: applicationId,
          ...options
        },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'RiskAssessment', id: applicationId },
        { type: 'RiskExplanation', id: applicationId },
        'ModelPrediction',
        'CounterfactualExplanation',
      ],
    }),

    // Get credit scores for applicant
    getCreditScores: builder.query<CreditScore[], number>({
      query: (applicantId) => `credit-scores/?applicant=${applicantId}`,
      providesTags: ['CreditScore'],
    }),

    // Add credit score
    addCreditScore: builder.mutation<CreditScore, Partial<CreditScore>>({
      query: (data) => ({
        url: `credit-scores/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CreditScore'],
    }),

    // Get risk analytics dashboard data
    getRiskAnalyticsDashboard: builder.query<RiskAnalyticsDashboardData, void>({
      query: () => 'analytics/dashboard/',
      providesTags: ['RiskAssessment'],
    }),

    // Get risk charts data
    getRiskChartsData: builder.query<RiskChartsData, void>({
      query: () => 'analytics/charts/',
      providesTags: ['RiskAssessment'],
    }),
  }),
});

export const {
  useGetRiskAssessmentQuery,
  useCreateRiskAssessmentMutation,
  useUpdateRiskAssessmentMutation,
  useGetRiskExplanationQuery,
  useGenerateRiskExplanationMutation,
  useGetModelPredictionsQuery,
  useGeneratePredictionMutation,
  useGetCounterfactualExplanationsQuery,
  useGenerateCounterfactualMutation,
  useGetDecisionQuery,
  useCreateDecisionMutation,
  useGetRiskAnalysisQuery,
  useRunRiskAnalysisMutation,
  useGetCreditScoresQuery,
  useAddCreditScoreMutation,
  useGetRiskAnalyticsDashboardQuery,
  useGetRiskChartsDataQuery,
} = riskApi;