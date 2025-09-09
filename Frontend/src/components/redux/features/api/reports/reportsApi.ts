import { apiSlice } from "../baseApi";

// Types
export interface Report {
  id: string;
  title: string;
  description: string;
  report_type: 'RISK_SUMMARY' | 'APPLICATION_ANALYTICS' | 'PERFORMANCE_METRICS' | 'COMPLIANCE_AUDIT' | 
               'FINANCIAL_OVERVIEW' | 'MONTHLY_SUMMARY' | 'QUARTERLY_REPORT' | 'CREDIT_SCORE_ANALYSIS' |
               'DEFAULT_PREDICTION' | 'PORTFOLIO_RISK' | 'UNDERWRITING_PERFORMANCE' | 'REGULATORY_COMPLIANCE' |
               'LOSS_MITIGATION' | 'CONCENTRATION_RISK' | 'MODEL_VALIDATION' | 'STRESS_TEST' | 'CUSTOM';
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
  shared_with: Array<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  }>;
  date_from?: string;
  date_to?: string;
  filters: Record<string, any>;
  config: Record<string, any>;
  data: Record<string, any>;
  file_path?: string;
  created_at: string;
  updated_at: string;
  generated_at?: string;
  expires_at?: string;
  views_count: number;
  downloads_count: number;
  can_edit: boolean;
  can_delete: boolean;
  is_expired: boolean;
  file_size?: number;
  // New caching and performance fields
  cache_key?: string;
  is_cached?: boolean;
  cache_expiry?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  report_type: string;
  template_config: Record<string, any>;
  default_filters: Record<string, any>;
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  is_public: boolean;
  allowed_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  template: ReportTemplate;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  is_active: boolean;
  next_run: string;
  last_run?: string;
  recipients: Array<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }>;
  email_recipients: string[];
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ReportKPI {
  id: string;
  name: string;
  description: string;
  metric_type: 'COUNT' | 'PERCENTAGE' | 'AVERAGE' | 'SUM' | 'RATIO' | 'TREND';
  display_format: string;
  color_scheme: Record<string, any>;
  chart_type: string;
  is_active: boolean;
  created_at: string;
}

export interface ReportAnalytics {
  total_reports: number;
  reports_by_type: Record<string, number>;
  reports_by_status: Record<string, number>;
  recent_activity: Array<{
    action: string;
    accessed_at: string;
    user__first_name: string;
    user__last_name: string;
    report__title: string;
  }>;
  top_creators: Array<{
    id: number;
    first_name: string;
    last_name: string;
    report_count: number;
  }>;
  popular_reports: Array<{
    id: string;
    title: string;
    report_type: string;
    views_count: number;
    downloads_count: number;
  }>;
  reports_this_month: number;
  reports_last_month: number;
  growth_rate: number;
  total_views: number;
  total_downloads: number;
  avg_views_per_report: number;
}

export interface RiskAnalytics {
  risk_distribution: Record<string, number>;
  avg_scores_by_rating: Record<string, number>;
  applications_by_status: Record<string, number>;
  total_assessments: number;
  total_applications: number;
}

export interface DashboardData {
  total_reports: number;
  pending_reports: number;
  completed_reports: number;
  failed_reports: number;
  recent_reports: Report[];
  reports_by_type: Record<string, {
    name: string;
    count: number;
  }>;
}

export interface GenerateReportRequest {
  report_type: string;
  title: string;
  description?: string;
  date_from?: string;
  date_to?: string;
  filters?: Record<string, any>;
  config?: Record<string, any>;
  shared_with_ids?: number[];
}

export interface ReportFilters {
  type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Reports CRUD
    getReports: builder.query<
      { results: Report[]; count: number; next?: string; previous?: string },
      ReportFilters & { page?: number; page_size?: number }
    >({
      query: (params) => ({
        url: "reports/reports/",
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        ),
      }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "Report" as const, id })),
              { type: "Report", id: "LIST" },
            ]
          : [{ type: "Report", id: "LIST" }],
    }),

    getReport: builder.query<Report, string>({
      query: (id) => `reports/reports/${id}/`,
      providesTags: (result, error, id) => [{ type: "Report", id }],
    }),

    generateReport: builder.mutation<Report, GenerateReportRequest>({
      query: (data) => ({
        url: "reports/reports/generate/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Report", id: "LIST" }],
    }),

    updateReport: builder.mutation<
      Report,
      { id: string; data: Partial<Report> }
    >({
      query: ({ id, data }) => ({
        url: `reports/reports/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Report", id },
        { type: "Report", id: "LIST" },
      ],
    }),

    deleteReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `reports/reports/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Report", id },
        { type: "Report", id: "LIST" },
      ],
    }),

    // Report actions
    exportReport: builder.query<Blob, { id: string; format: string }>({
      query: ({ id, format }) => ({
        url: `reports/reports/${id}/export/`,
        params: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),

    shareReport: builder.mutation<
      { message: string },
      { id: string; user_ids: number[] }
    >({
      query: ({ id, user_ids }) => ({
        url: `reports/reports/${id}/share/`,
        method: "POST",
        body: { user_ids },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Report", id }],
    }),

    getMyReports: builder.query<Report[], void>({
      query: () => "reports/reports/my_reports/",
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "Report" as const, id })),
              { type: "Report", id: "MY_REPORTS" },
            ]
          : [{ type: "Report", id: "MY_REPORTS" }],
    }),

    // Analytics
    getReportAnalytics: builder.query<ReportAnalytics, void>({
      query: () => "reports/reports/analytics/",
      providesTags: [{ type: "Analytics", id: "REPORTS" }],
    }),

    getRiskAnalytics: builder.query<RiskAnalytics, void>({
      query: () => "reports/analytics/risk_analytics/",
      providesTags: [{ type: "Analytics", id: "RISK" }],
    }),

    getDashboardData: builder.query<DashboardData, void>({
      query: () => "reports/analytics/dashboard_data/",
      providesTags: [{ type: "Analytics", id: "DASHBOARD" }],
    }),

    // Templates
    getReportTemplates: builder.query<ReportTemplate[], void>({
      query: () => "reports/templates/",
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "ReportTemplate" as const, id })),
              { type: "ReportTemplate", id: "LIST" },
            ]
          : [{ type: "ReportTemplate", id: "LIST" }],
    }),

    getReportTemplate: builder.query<ReportTemplate, string>({
      query: (id) => `reports/templates/${id}/`,
      providesTags: (result, error, id) => [{ type: "ReportTemplate", id }],
    }),

    createReportTemplate: builder.mutation<
      ReportTemplate,
      Partial<ReportTemplate>
    >({
      query: (data) => ({
        url: "reports/templates/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "ReportTemplate", id: "LIST" }],
    }),

    updateReportTemplate: builder.mutation<
      ReportTemplate,
      { id: string; data: Partial<ReportTemplate> }
    >({
      query: ({ id, data }) => ({
        url: `reports/templates/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ReportTemplate", id },
        { type: "ReportTemplate", id: "LIST" },
      ],
    }),

    deleteReportTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `reports/templates/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ReportTemplate", id },
        { type: "ReportTemplate", id: "LIST" },
      ],
    }),

    // Schedules
    getReportSchedules: builder.query<ReportSchedule[], void>({
      query: () => "reports/schedules/",
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "ReportSchedule" as const, id })),
              { type: "ReportSchedule", id: "LIST" },
            ]
          : [{ type: "ReportSchedule", id: "LIST" }],
    }),

    createReportSchedule: builder.mutation<
      ReportSchedule,
      Partial<ReportSchedule>
    >({
      query: (data) => ({
        url: "reports/schedules/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "ReportSchedule", id: "LIST" }],
    }),

    // KPIs
    getReportKPIs: builder.query<ReportKPI[], void>({
      query: () => "reports/kpis/",
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "ReportKPI" as const, id })),
              { type: "ReportKPI", id: "LIST" },
            ]
          : [{ type: "ReportKPI", id: "LIST" }],
    }),
  }),
});

export const {
  // Reports
  useGetReportsQuery,
  useGetReportQuery,
  useGenerateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useLazyExportReportQuery,
  useShareReportMutation,
  useGetMyReportsQuery,

  // Analytics
  useGetReportAnalyticsQuery,
  useGetRiskAnalyticsQuery,
  useGetDashboardDataQuery,

  // Templates
  useGetReportTemplatesQuery,
  useGetReportTemplateQuery,
  useCreateReportTemplateMutation,
  useUpdateReportTemplateMutation,
  useDeleteReportTemplateMutation,

  // Schedules
  useGetReportSchedulesQuery,
  useCreateReportScheduleMutation,

  // KPIs
  useGetReportKPIsQuery,
} = reportsApi;