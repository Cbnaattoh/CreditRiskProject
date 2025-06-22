import { apiSlice } from "../../api/baseApi";
import {
  setCredentials,
  setMFARequired,
  logout,
  setAuthToken,
} from "../authSlice";

// Base interfaces
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  mfa_fully_configured?: boolean;
}

interface TokenData {
  access: string;
  refresh: string;
}

interface BaseResponse {
  message?: string;
}

// Authentication request interfaces
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  confirm_password: string;
  user_type: string;
  profile_picture?: File;
  mfa_enabled?: boolean;
  terms_accepted: boolean;
}

// MFA related interfaces
interface MFACredentials {
  uid: string;
  temp_token: string;
  token: string;
  backup_code?: string;
}

interface MFASetupRequest {
  enable: boolean;
  backup_codes_acknowledged?: boolean;
}

interface MFASetupResponse extends BaseResponse {
  status: string;
  secret?: string;
  uri?: string;
  backup_codes?: string[];
}

interface MFASetupVerifyRequest {
  token: string;
}

// Authentication response interfaces
interface LoginResponse extends BaseResponse {
  user?: User;
  access?: string;
  refresh?: string;
  requires_mfa?: boolean;
  temp_token?: string;
  uid?: string;
  mfa_methods?: string[];
  requires_password_change?: boolean;
  password_expired?: boolean;
}

interface RegisterResponse extends BaseResponse {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  is_verified?: boolean;
  access?: string;
  refresh?: string;
}

interface MFAVerifyResponse extends BaseResponse {
  user: User;
  access: string;
  refresh: string;
  mfa_verified: boolean;
}

// Utility response interfaces
interface RefreshTokenResponse {
  access: string;
}

interface TokenVerificationResponse {
  valid: boolean;
}

interface StatusResponse extends BaseResponse {
  status: string;
}

// Password related interfaces
interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
}

interface EmailVerificationRequest {
  token: string;
}

interface ResendVerificationRequest {
  email: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "auth/login/",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const user = data.user;
          const mfaEnabled = user?.mfa_enabled === true;
          const mfaFullyConfigured = user?.mfa_fully_configured === true;

          if (data.requires_mfa && data.temp_token) {
            dispatch(setAuthToken({ token: data.temp_token }));
            dispatch(
              setMFARequired({
                tempToken: data.temp_token,
                uid: data.uid!,
                mfaMethods: data.mfa_methods,
              })
            );
            return;
          }

          if (arg.enableMFA && mfaEnabled && !mfaFullyConfigured) {
            dispatch(
              setAuthToken({
                token: data.access!,
                refreshToken: data.refresh,
              })
            );
            return;
          }

          if (data.access && data.user) {
            dispatch(
              setCredentials({
                user: data.user,
                token: data.access,
                refreshToken: data.refresh,
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

    register: builder.mutation<RegisterResponse, RegisterCredentials>({
      query: (credentials) => {
        const formData = new FormData();

        formData.append("first_name", credentials.first_name);
        formData.append("last_name", credentials.last_name);
        formData.append("email", credentials.email);
        formData.append("phone_number", credentials.phone_number || "");
        formData.append("password", credentials.password);
        formData.append("confirm_password", credentials.confirm_password);
        formData.append("user_type", credentials.user_type);
        formData.append(
          "mfa_enabled",
          credentials.mfa_enabled ? "true" : "false"
        );
        formData.append(
          "terms_accepted",
          credentials.terms_accepted ? "true" : "false"
        );

        if (
          credentials.profile_picture &&
          credentials.profile_picture instanceof File
        ) {
          formData.append("profile_picture", credentials.profile_picture);
        }

        return {
          url: "auth/register/",
          method: "POST",
          body: formData,
          prepareHeaders: (headers) => {
            headers.delete("Content-Type");
            return headers;
          },
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data.access && data.refresh) {
            const user: User = {
              id: data.id!,
              email: data.email!,
              name: `${data.first_name} ${data.last_name}`.trim(),
              role: data.user_type!,
              is_verified: data.is_verified,
            };

            dispatch(
              setCredentials({
                user,
                token: data.access,
                refreshToken: data.refresh,
              })
            );
          }
        } catch (error) {
          console.error("Registration error:", error);
        }
      },
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Registration server error" },
          };
        }
        return response;
      },
      invalidatesTags: ["Auth"],
    }),

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

    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: "auth/token/refresh/",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setAuthToken({
              token: data.access,
            })
          );
        } catch (error) {
          console.error("Token refresh failed:", error);
          dispatch(logout());
        }
      },
    }),

    getCurrentUser: builder.query<User, void>({
      query: () => "users/me/",
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

    requestPasswordReset: builder.mutation<BaseResponse, PasswordResetRequest>({
      query: (data) => ({
        url: "auth/password-reset/",
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
  useRegisterMutation,
  useVerifyMFAMutation,
  useSetupMFAMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useVerifyTokenQuery,
  useRefreshTokenMutation,
  useVerifyMFASetupMutation,
  useChangePasswordMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
} = authApi;

export type {
  User,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  RegisterResponse,
  MFACredentials,
  MFASetupRequest,
  MFASetupResponse,
  MFAVerifyResponse,
  BaseResponse,
  StatusResponse,
};
