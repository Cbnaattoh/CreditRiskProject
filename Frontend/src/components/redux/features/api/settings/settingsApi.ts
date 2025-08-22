import { createApi } from '@reduxjs/toolkit/query/react';
import { apiSlice } from '../baseApi';

// Types for the settings API
export interface UserPreferences {
  id?: number;
  theme: 'light' | 'dark' | 'auto';
  compact_view: boolean;
  animations_enabled: boolean;
  sidebar_collapsed: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  notification_frequency: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never';
  security_alerts: boolean;
  marketing_emails: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  auto_save: boolean;
  session_timeout: number;
  profile_visibility: 'public' | 'private' | 'team';
  activity_tracking: boolean;
  data_sharing: boolean;
  custom_settings: Record<string, any>;
  customization_level?: number;
  updated_at?: string;
}

export interface UserSession {
  id: number;
  session_key: string;
  ip_address: string;
  device_type: string;
  browser: string;
  os: string;
  location: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  terminated_by_user: boolean;
  security_score: number;
  time_since_login: string;
  is_current_session: boolean;
  device_info: {
    device: string;
    os: string;
    location: string;
  };
}

export interface SecurityEvent {
  id: number;
  user: number;
  user_email: string;
  event_type: 'login' | 'logout' | 'password_change' | 'mfa_enable' | 'mfa_disable' |
  'profile_update' | 'preferences_update' | 'suspicious_activity' |
  'session_terminated' | 'permission_granted' | 'permission_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
  time_ago: string;
}

export interface SettingsOverview {
  profile_completion: number;
  security_score: number;
  active_sessions: number;
  recent_security_events: number;
  mfa_enabled: boolean;
  last_password_change: string;
  preferences_configured: number;
  current_theme: string;
  notification_status: string;
  language_preference: string;
  auto_save_enabled: boolean;
}

export interface SettingsRecommendation {
  type: 'security' | 'profile' | 'notification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  category: string;
}

export interface BulkPreferencesUpdate {
  preferences: Record<string, any>;
}

// Credit Worthiness Index interfaces
export interface CreditWorthinessIndex {
  credit_index: number;
  credit_tier: 'excellent' | 'good' | 'developing';
  tier_label: string;
  risk_category: 'low' | 'medium' | 'high';
  factors: {
    profile_data: {
      score: number;
      weight: number;
      contribution: number;
      status: 'complete' | 'incomplete';
    };
    identity_verified: {
      verified: boolean;
      weight: number;
      contribution: number;
      status: 'verified' | 'pending';
    };
    security_level: {
      mfa_enabled: boolean;
      weight: number;
      contribution: number;
      status: 'high' | 'standard';
    };
    government_id: {
      provided: boolean;
      weight: number;
      contribution: number;
      status: 'provided' | 'missing';
    };
  };
  last_updated: string;
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
}

// Compliance Status interfaces
export interface ComplianceStatus {
  overall_status: 'compliant' | 'mostly_compliant' | 'pending';
  status_label: string;
  status_color: 'green' | 'amber' | 'red';
  compliance_score: number;
  checks: {
    kyc_verification: {
      status: boolean;
      required: boolean;
      weight: number;
    };
    data_completeness: {
      status: boolean;
      score: number;
      threshold: number;
      required: boolean;
      weight: number;
    };
    security_standards: {
      status: boolean;
      mfa_enabled: boolean;
      password_strength: boolean;
      required: boolean;
      weight: number;
    };
  };
  last_updated: string;
  next_review_due: string;
}

// Activity Analytics interfaces
export interface ActivityAnalytics {
  account_age: {
    days: number;
    formatted: string;
  };
  last_activity: {
    date: string | null;
    days_since: number | null;
    display: string;
    pattern: 'new_user' | 'active' | 'regular' | 'dormant';
    pattern_label: string;
    pattern_color: 'gray' | 'green' | 'amber' | 'red';
  };
  risk_assessment: {
    level: 'low' | 'medium' | 'high';
    label: string;
    color: 'green' | 'amber' | 'red';
    factors: string[];
  };
  insights: {
    message: string;
    pattern: string;
    engagement_score: number;
  };
  recent_metrics: {
    sessions_count: number;
    security_events: number;
    period_days: number;
  };
  last_updated: string;
}

// UserProfile interface
export interface EnhancedUserProfile {
  profile_picture?: string;
  company?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  date_of_birth?: string;
  phone_secondary?: string;
  address?: string;
  linkedin_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  completion_score: number;
  missing_fields: Array<{
    field: string;
    display_name: string;
    required: boolean;
  }>;
  last_profile_update: string;
}

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // User Preferences endpoints
    getUserPreferences: builder.query<UserPreferences, void>({
      query: () => 'users/settings/preferences/',
      providesTags: ['UserPreferences'],
      pollingInterval: 30000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    updateUserPreferences: builder.mutation<UserPreferences, Partial<UserPreferences>>({
      query: (preferences) => ({
        url: 'users/settings/preferences/update_my_preferences/',
        method: 'PATCH',
        body: preferences,
      }),
      invalidatesTags: ['UserPreferences', 'SettingsOverview'],
    }),

    bulkUpdatePreferences: builder.mutation<UserPreferences, BulkPreferencesUpdate>({
      query: (data) => ({
        url: 'users/settings/preferences/bulk_update/',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['UserPreferences', 'SettingsOverview'],
    }),

    resetPreferencesToDefaults: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'users/settings/preferences/reset_to_defaults/',
        method: 'POST',
      }),
      invalidatesTags: ['UserPreferences', 'SettingsOverview'],
    }),

    // Session Management endpoints
    getUserSessions: builder.query<UserSession[], void>({
      query: () => 'users/settings/sessions/',
      providesTags: ['UserSessions'],
      pollingInterval: 15000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getCurrentSession: builder.query<UserSession, void>({
      query: () => 'users/settings/sessions/current/',
      providesTags: ['UserSessions'],
      pollingInterval: 20000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    terminateSession: builder.mutation<{ message: string }, number>({
      query: (sessionId) => ({
        url: `users/settings/sessions/${sessionId}/terminate/`,
        method: 'POST',
      }),
      invalidatesTags: ['UserSessions', 'SettingsOverview'],
    }),

    terminateAllOtherSessions: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'users/settings/sessions/terminate_all_others/',
        method: 'POST',
      }),
      invalidatesTags: ['UserSessions', 'SettingsOverview'],
    }),

    // Security Events endpoints
    getSecurityEvents: builder.query<SecurityEvent[], void>({
      query: () => 'users/settings/security-events/',
      providesTags: ['SecurityEvents'],
      pollingInterval: 45000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getRecentSecurityEvents: builder.query<SecurityEvent[], void>({
      query: () => 'users/settings/security-events/recent/',
      providesTags: ['SecurityEvents'],
      pollingInterval: 30000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getSecurityEventsSummary: builder.query<{
      total_events: number;
      recent_activity: number;
      by_event_type: Array<{ event_type: string; count: number }>;
      by_severity: Array<{ severity: string; count: number }>;
      unresolved_count: number;
    }, void>({
      query: () => 'users/settings/security-events/summary/',
      providesTags: ['SecurityEvents'],
      pollingInterval: 60000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    // Settings Overview endpoints
    getSettingsOverview: builder.query<SettingsOverview, void>({
      query: () => 'users/settings/overview/',
      providesTags: ['SettingsOverview'],
      pollingInterval: 25000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getSettingsRecommendations: builder.query<{
      recommendations: SettingsRecommendation[];
      total_count: number;
      high_priority_count: number;
    }, void>({
      query: () => 'users/settings/overview/recommendations/',
      providesTags: ['SettingsOverview'],
      pollingInterval: 120000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    // Enterprise Account Analytics endpoints
    getCreditWorthinessIndex: builder.query<CreditWorthinessIndex, void>({
      query: () => 'users/settings/overview/credit_worthiness_index/',
      providesTags: ['CreditWorthiness', 'SettingsOverview'],
      pollingInterval: 60000, // Update every minute for real-time credit scoring
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getComplianceStatus: builder.query<ComplianceStatus, void>({
      query: () => 'users/settings/overview/compliance_status/',
      providesTags: ['ComplianceStatus', 'SettingsOverview'],
      pollingInterval: 90000, // Update every 1.5 minutes for compliance monitoring
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getActivityAnalytics: builder.query<ActivityAnalytics, void>({
      query: () => 'users/settings/overview/activity_analytics/',
      providesTags: ['ActivityAnalytics', 'SettingsOverview'],
      pollingInterval: 45000, // Update every 45 seconds for activity tracking
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    // Enhanced Profile endpoints
    // getEnhancedUserProfile: builder.query<EnhancedUserProfile, void>({
    //   query: () => 'users/me/profile/enhanced/',
    //   providesTags: ['UserProfile'],
    //   pollingInterval: 40000,
    //   refetchOnFocus: true,
    //   refetchOnReconnect: true,
    // }),

    // updateEnhancedUserProfile: builder.mutation<EnhancedUserProfile, Partial<EnhancedUserProfile>>({
    //   query: (profileData) => ({
    //     url: 'users/me/profile/enhanced/',
    //     method: 'PATCH',
    //     body: profileData,
    //   }),
    //   invalidatesTags: ['UserProfile', 'SettingsOverview'],
    // }),
  }),
});

export const {
  // Preferences hooks
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useBulkUpdatePreferencesMutation,
  useResetPreferencesToDefaultsMutation,

  // Session management hooks
  useGetUserSessionsQuery,
  useGetCurrentSessionQuery,
  useTerminateSessionMutation,
  useTerminateAllOtherSessionsMutation,

  // Security events hooks
  useGetSecurityEventsQuery,
  useGetRecentSecurityEventsQuery,
  useGetSecurityEventsSummaryQuery,

  // Settings overview hooks
  useGetSettingsOverviewQuery,
  useGetSettingsRecommendationsQuery,

  // Enterprise Account Analytics hooks
  useGetCreditWorthinessIndexQuery,
  useGetComplianceStatusQuery,
  useGetActivityAnalyticsQuery,

  // Enhanced profile hooks
  // useGetEnhancedUserProfileQuery,
  // useUpdateEnhancedUserProfileMutation,
} = settingsApi;