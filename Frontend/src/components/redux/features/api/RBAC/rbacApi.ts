import { apiSlice } from "../baseApi";
import { updatePermissions } from "../../auth/authSlice";
import type { PermissionSummary } from "./rbac";

interface DashboardResponse {
  summary: {
    total_users: number;
    total_roles: number;
    total_permissions: number;
    active_assignments: number;
    expiring_soon: number;
    expired: number;
  };
  popular_roles: Array<{
    id: number;
    name: string;
    assignment_count: number;
  }>;
  recent_activity: {
    assignments_24h: number;
    permission_checks_24h: number;
  };
}

interface UsersListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Array<{
    id: number;
    email: string;
    full_name: string;
    user_type: string;
    user_type_display: string;
    status: string;
    is_active: boolean;
    is_verified: boolean;
    mfa_enabled: boolean;
    active_roles: Array<{
      id: number;
      name: string;
      assigned_at: string;
      assigned_by?: string;
      expires_at?: string;
    }>;
    last_login?: string;
    date_joined: string;
    days_since_joined: number;
    days_since_last_login?: number;
    profile: {
      company?: string;
      job_title?: string;
      department?: string;
    };
  }>;
  summary: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    user_types: Record<
      string,
      { code: string; display: string; count: number }
    >;
    login_activity: {
      never_logged_in: number;
      logged_in_week: number;
      activity_rate_week: number;
    };
    security: {
      mfa_enabled: number;
      mfa_adoption_rate: number;
      unverified_users: number;
    };
  };
  filters_applied: {
    search?: string;
    user_type?: string;
    status?: string;
    role?: string;
    is_active?: string;
    has_mfa?: string;
    sort_by?: string;
  };
}

interface UsersFiltersResponse {
  roles: Array<{ id: number; name: string }>;
  user_types: Array<{ code: string; display: string }>;
  status_options: Array<{ code: string; display: string }>;
  sort_options: Array<{ code: string; display: string }>;
}

export const rbacApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyPermissions: builder.query<
      PermissionSummary & { permission_codes: string[]; roles: string[] },
      void
    >({
      query: () => "users/me/permissions/",
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            updatePermissions({
              permissions: data.permission_codes || [],
              roles: data.roles || [],
            })
          );
        } catch (error) {
          console.error("Get permissions failed:", error);
        }
      },
      providesTags: ["Auth"],
    }),

    // RBAC Dashboard (admin only)
    getRBACDashboard: builder.query<DashboardResponse, void>({
      query: () => "auth/rbac/dashboard/",
      providesTags: ["Auth"],
    }),

    // Admin users list with comprehensive filtering
    getAdminUsersList: builder.query<
      UsersListResponse,
      {
        search?: string;
        user_type?: string;
        status?: string;
        role?: string;
        is_active?: boolean;
        has_mfa?: boolean;
        sort_by?: string;
        page?: number;
        page_size?: number;
      }
    >({
      query: (params) => ({
        url: "auth/rbac/users/",
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        ),
      }),
      providesTags: ["User"],
    }),

    // Get user detail (admin only)
    getAdminUserDetail: builder.query<any, number>({
      query: (userId) => `auth/rbac/users/${userId}/`,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    // Get filter options for admin users
    getUsersFilters: builder.query<UsersFiltersResponse, void>({
      query: () => "users/admin/users/filters/",
      providesTags: ["Auth"],
    }),

    // User management actions (admin only)
    assignUserRole: builder.mutation<
      any,
      { userId: number; role_id: number; expires_at?: string }
    >({
      query: ({ userId, ...body }) => ({
        url: `auth/rbac/users/${userId}/assign_role/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        "User",
      ],
    }),

    removeUserRole: builder.mutation<any, { userId: number; role_id: number }>({
      query: ({ userId, role_id }) => ({
        url: `auth/rbac/users/${userId}/remove_role/`,
        method: "DELETE",
        body: { role_id },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        "User",
      ],
    }),

    // Bulk user actions
    bulkUserActions: builder.mutation<
      any,
      {
        user_ids: number[];
        action: "activate" | "deactivate" | "delete" | "reset_password";
      }
    >({
      query: (body) => ({
        url: "users/admin/bulk-actions/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Bulk user role assignment
    bulkAssignRoles: builder.mutation<
      any,
      {
        user_ids: number[];
        role_id: number;
        expires_at?: string;
      }
    >({
      query: (body) => ({
        url: "auth/rbac/users-roles/bulk_assign/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Bulk user role removal
    bulkRemoveRoles: builder.mutation<
      any,
      {
        user_ids: number[];
        role_id: number;
      }
    >({
      query: (body) => ({
        url: "auth/rbac/users-roles/bulk_remove/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Get all roles
    getRoles: builder.query<any, void>({
      query: () => "auth/rbac/roles/",
      providesTags: ["Auth"],
    }),

    // Get all permissions
    getPermissions: builder.query<any, void>({
      query: () => "auth/rbac/permissions/",
      providesTags: ["Auth"],
    }),

    // Get user roles
    getUserRoles: builder.query<any, { user?: number; role?: number }>({
      query: (params) => ({
        url: "auth/rbac/users-roles/",
        params,
      }),
      providesTags: ["User"],
    }),

    // User account status management
    updateUserStatus: builder.mutation<
      any,
      { userId: number; action: "activate" | "deactivate" }
    >({
      query: ({ userId, action }) => ({
        url: `users/admin/account-status/${userId}/`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        "User",
      ],
    }),

    // Admin password reset
    adminResetPassword: builder.mutation<any, { userId: number }>({
      query: ({ userId }) => ({
        url: `users/admin/password-reset/${userId}/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),
  }),
});

export const {
  useGetMyPermissionsQuery,
  useGetRBACDashboardQuery,
  useGetAdminUsersListQuery,
  useGetAdminUserDetailQuery,
  useGetUsersFiltersQuery,
  useAssignUserRoleMutation,
  useRemoveUserRoleMutation,
  useBulkUserActionsMutation,
  useBulkAssignRolesMutation,
  useBulkRemoveRolesMutation,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useGetUserRolesQuery,
  useUpdateUserStatusMutation,
  useAdminResetPasswordMutation,
} = rbacApi;
