import type { RootState } from '../../../store';

// Types
export interface BehavioralBiometric {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user_type: string;
    is_active: boolean;
  };
  user_email: string;
  user_name: string;
  typing_pattern: Record<string, any>;
  mouse_movement: Record<string, any>;
  device_interaction: Record<string, any>;
  last_updated: string;
  confidence_score: number;
  is_active: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SuspiciousActivity {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user_type: string;
    is_active: boolean;
  };
  user_email: string;
  user_name: string;
  activity_type: 'LOGIN' | 'PASSWORD' | 'APPLICATION' | 'OTHER';
  activity_type_display: string;
  detected_at: string;
  ip_address: string;
  user_agent: string;
  confidence: number;
  details: Record<string, any>;
  formatted_details: Record<string, any>;
  was_challenged: boolean;
  was_successful: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityDashboardStats {
  total_users_monitored: number;
  high_risk_users: number;
  suspicious_activities_today: number;
  critical_alerts: number;
  behavioral_profiles_count: number;
  avg_confidence_score: number;
  top_threat_types: Array<{
    activity_type: string;
    count: number;
  }>;
  recent_activities: SuspiciousActivity[];
}

export interface SecurityAlert {
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  user_email: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface ActivitySummary {
  activity_type: string;
  count: number;
  avg_confidence: number;
}

// Import the base API slice to use its baseQuery with reauth
import { apiSlice } from '../baseApi';

// API slice - use the main API's baseQuery with token refresh
export const securityApi = apiSlice.injectEndpoints({
  tagTypes: ['BehavioralBiometric', 'SuspiciousActivity', 'SecurityStats', 'SecurityAlert'],
  endpoints: (builder) => ({
    // Behavioral Biometrics endpoints
    getBehavioralBiometrics: builder.query<BehavioralBiometric[], {
      user_id?: number;
      risk_level?: string;
      is_active?: boolean;
      page?: number;
    }>({
      query: (params = {}) => ({
        url: 'security/behavioral-biometrics/',
        params,
      }),
      providesTags: ['BehavioralBiometric'],
    }),

    getBehavioralBiometric: builder.query<BehavioralBiometric, number>({
      query: (id) => `security/behavioral-biometrics/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'BehavioralBiometric', id }],
    }),

    getHighRiskUsers: builder.query<BehavioralBiometric[], void>({
      query: () => 'security/behavioral-biometrics/high_risk_users/',
      providesTags: ['BehavioralBiometric'],
    }),

    updateConfidenceScore: builder.mutation<BehavioralBiometric, { id: number; confidence_score: number }>({
      query: ({ id, confidence_score }) => ({
        url: `security/behavioral-biometrics/${id}/update_confidence/`,
        method: 'POST',
        body: { confidence_score },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'BehavioralBiometric', id }],
    }),

    // Suspicious Activities endpoints
    getSuspiciousActivities: builder.query<SuspiciousActivity[], {
      user_id?: number;
      activity_type?: string;
      risk_level?: string;
      days?: number;
      page?: number;
    }>({
      query: (params = {}) => ({
        url: 'security/suspicious-activities/',
        params,
      }),
      providesTags: ['SuspiciousActivity'],
    }),

    getSuspiciousActivity: builder.query<SuspiciousActivity, number>({
      query: (id) => `security/suspicious-activities/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'SuspiciousActivity', id }],
    }),

    getCriticalAlerts: builder.query<SuspiciousActivity[], void>({
      query: () => 'security/suspicious-activities/critical_alerts/',
      providesTags: ['SuspiciousActivity'],
    }),

    getActivitySummary: builder.query<ActivitySummary[], void>({
      query: () => 'security/suspicious-activities/activity_summary/',
      providesTags: ['SuspiciousActivity'],
    }),

    markActivityChallenged: builder.mutation<SuspiciousActivity, number>({
      query: (id) => ({
        url: `security/suspicious-activities/${id}/mark_challenged/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'SuspiciousActivity', id }],
    }),

    createSuspiciousActivity: builder.mutation<SuspiciousActivity, {
      user_id: number;
      activity_type: string;
      ip_address: string;
      user_agent: string;
      confidence: number;
      details: Record<string, any>;
      was_challenged?: boolean;
      was_successful?: boolean;
    }>({
      query: (data) => ({
        url: 'security/suspicious-activities/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SuspiciousActivity'],
    }),

    deleteSuspiciousActivity: builder.mutation<void, number>({
      query: (id) => ({
        url: `security/suspicious-activities/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SuspiciousActivity', 'SecurityStats'],
    }),

    // Dashboard endpoints
    getSecurityDashboardStats: builder.query<SecurityDashboardStats, void>({
      query: () => 'security/dashboard/stats/',
      providesTags: ['SecurityStats'],
    }),

    getSecurityAlerts: builder.query<SecurityAlert[], void>({
      query: () => 'security/alerts/',
      providesTags: ['SecurityAlert'],
    }),

    // Behavioral data submission (for active monitoring)
    submitBehavioralData: builder.mutation<{
      confidence_score: number;
      biometric_id: number;
      created: boolean;
    }, {
      typing?: Record<string, any>;
      mouse?: Record<string, any>;
    }>({
      query: (data) => ({
        url: 'security/behavioral-data/submit/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BehavioralBiometric'],
    }),
  }),
});

export const {
  useGetBehavioralBiometricsQuery,
  useGetBehavioralBiometricQuery,
  useGetHighRiskUsersQuery,
  useUpdateConfidenceScoreMutation,
  useGetSuspiciousActivitiesQuery,
  useGetSuspiciousActivityQuery,
  useGetCriticalAlertsQuery,
  useGetActivitySummaryQuery,
  useMarkActivityChallengedMutation,
  useCreateSuspiciousActivityMutation,
  useDeleteSuspiciousActivityMutation,
  useGetSecurityDashboardStatsQuery,
  useGetSecurityAlertsQuery,
  useSubmitBehavioralDataMutation,
} = securityApi;

// Export types for external use
export type { BehavioralBiometric, SuspiciousActivity, SecurityDashboardStats, SecurityAlert, ActivitySummary };