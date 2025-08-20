import { apiSlice } from "../../api/baseApi";
import {
  setCredentials,
  setMFARequired,
  setMFASetupRequired,
  completeMFASetup,
  logout,
  setAuthToken,
  clearPasswordChangeRequirements,
} from "../authSlice";
import type {
  AuthUser,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MFACredentials,
  MFASetupRequest,
  MFASetupResponse,
  MFAVerifyResponse,
} from "../../user/types/user";
import { transformAuthUser } from "../../user/types/user";

interface LoginCredentials {
  email: string;
  password: string;
  enableMFA?: boolean;
}

interface MFASetupVerifyRequest {
  token: string;
}

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

interface TokenVerificationResponse {
  valid: boolean;
}

interface StatusResponse {
  message?: string;
  status: string;
}

interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetConfirmRequest {
  token: string;
  uid: string;
  new_password: string;
  confirm_password: string;
}

interface EmailVerificationRequest {
  token: string;
}

interface ResendVerificationRequest {
  email: string;
}

interface BaseResponse {
  message?: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "auth/login/",
        method: "POST",
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const user = data.user;
          const mfaEnabled = user?.mfa_enabled === true;
          const mfaFullyConfigured = user?.mfa_fully_configured === true;

          // Handle MFA verification required (user has fully configured MFA)
          if (data.requires_mfa && data.temp_token && mfaEnabled && mfaFullyConfigured) {
            dispatch(setAuthToken({ token: data.temp_token }));
            dispatch(
              setMFARequired({
                tempToken: data.temp_token,
                uid: data.uid!,
                mfaMethods: ["totp"],
              })
            );
            return;
          }

          // Handle MFA setup required (enhanced backend response)
          if (data.requires_mfa_setup || data.limited_access || data.token_type === 'mfa_setup') {
            dispatch(
              setMFASetupRequired({
                user: data.user,
                token: data.access!,
                refreshToken: data.refresh,
                message: data.message,
              })
            );
            return;
          }

          // Standard successful login with full access
          if (data.access && data.user) {
            dispatch(
              setCredentials({
                user: data.user,
                token: data.access,
                refreshToken: data.refresh,
                tokenType: data.token_type || 'full_access',
                requiresMFASetup: data.requires_mfa_setup || false,
                limitedAccess: data.limited_access || false,
                mfaCompleted: data.mfa_completed !== false,
                requires_password_change: data.requires_password_change || false,
                password_expired: data.password_expired || false,
                temporary_password: data.temporary_password || false,
                created_by_admin: data.created_by_admin || false,
              })
            );
          }
        } catch (error) {
          console.error("Login error:", error);
        }
      },
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Authentication server error" },
          };
        }
        return response;
      },
      invalidatesTags: ["Auth"],
    }),

    // Note: Registration is now handled by the progressive registration wizard
    // using the registrationApi service with step-by-step validation

    verifyMFA: builder.mutation<MFAVerifyResponse, MFACredentials>({
      query: (credentials) => ({
        url: "auth/mfa/verify/",
        method: "POST",
        body: {
          uid: credentials.uid,
          temp_token: credentials.temp_token,
          token: credentials.token,
          backup_code: credentials.backup_code,
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              token: data.access,
              refreshToken: data.refresh,
              tokenType: data.token_type || 'full_access',
              requiresMFASetup: false,
              limitedAccess: false,
              mfaCompleted: true,
            })
          );
        } catch (error) {
          console.error("MFA verification error:", error);
        }
      },
      invalidatesTags: ["Auth", "MFA"],
    }),

    setupMFA: builder.mutation<MFASetupResponse, MFASetupRequest>({
      query: (credentials) => ({
        url: "auth/mfa/setup/",
        method: "POST",
        body: credentials,
      }),
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Authentication required" },
          };
        }
        return response;
      },
      invalidatesTags: ["Auth"],
    }),

    verifyMFASetup: builder.mutation<StatusResponse, MFASetupVerifyRequest>({
      query: (credentials) => ({
        url: "auth/mfa/setup/verify/",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // If the response includes new tokens (indicating MFA setup completion)
          if ('access' in data && 'token_type' in data) {
            dispatch(
              completeMFASetup({
                token: (data as any).access,
                refreshToken: (data as any).refresh,
                tokenType: (data as any).token_type || 'full_access',
              })
            );
          }
        } catch (error) {
          console.error("MFA setup verification error:", error);
        }
      },
      invalidatesTags: ["Auth", "MFA"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "auth/logout/",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          dispatch(logout());
        }
      },
      invalidatesTags: ["Auth", "User", "MFA"],
    }),

    verifyToken: builder.query<TokenVerificationResponse, void>({
      query: () => ({
        url: "auth/verify-token/",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),

    refreshToken: builder.mutation<RefreshTokenResponse, { refresh: string }>({
      query: ({ refresh }) => ({
        url: "auth/token/refresh/",
        method: "POST",
        body: { refresh },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setAuthToken({
              token: data.access,
              refreshToken: data.refresh,
            })
          );
        } catch (error) {
          console.error("Token refresh failed:", error);
          dispatch(logout());
        }
      },
    }),

    getCurrentUser: builder.query<AuthUser, void>({
      query: () => "users/me/",
      transformResponse: (response: any) => transformAuthUser(response),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Optionally update user data in auth state
          // dispatch(setUserData(data));
        } catch (error) {
          console.error("Get current user failed:", error);
          const errorStatus = (error as any)?.error?.status;
          if (errorStatus === 401 || errorStatus === 403) {
            dispatch(logout());
          }
        }
      },
      providesTags: ["User"],
    }),

    changePassword: builder.mutation<BaseResponse, ChangePasswordRequest>({
      query: (credentials) => ({
        url: "auth/change-password/",
        method: "POST",
        body: credentials,
      }),
    }),

    changePasswordRequired: builder.mutation<BaseResponse, ChangePasswordRequest>({
      query: (credentials) => ({
        url: "auth/password-change-required/",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear password change requirements after successful change
          dispatch(clearPasswordChangeRequirements());
        } catch (error) {
          console.error("Password change required error:", error);
        }
      },
    }),

    requestPasswordReset: builder.mutation<BaseResponse, PasswordResetRequest>({
      query: (data) => ({
        url: "auth/password-reset/request/",
        method: "POST",
        body: data,
      }),
    }),

    confirmPasswordReset: builder.mutation<
      BaseResponse,
      PasswordResetConfirmRequest
    >({
      query: (data) => ({
        url: "auth/password-reset/confirm/",
        method: "POST",
        body: data,
      }),
    }),

    verifyEmail: builder.mutation<BaseResponse, EmailVerificationRequest>({
      query: (data) => ({
        url: "auth/verify-email/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    resendVerificationEmail: builder.mutation<
      BaseResponse,
      ResendVerificationRequest
    >({
      query: (data) => ({
        url: "auth/resend-verification/",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  // useRegisterMutation, // Removed - now handled by registrationApi
  useVerifyMFAMutation,
  useSetupMFAMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useVerifyTokenQuery,
  useRefreshTokenMutation,
  useVerifyMFASetupMutation,
  useChangePasswordMutation,
  useChangePasswordRequiredMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
} = authApi;

export type { LoginCredentials, BaseResponse, StatusResponse };
