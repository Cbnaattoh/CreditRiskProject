import { apiSlice } from "../../api/baseApi";
import {
  setCredentials,
  setMFARequired,
  logout,
  setAuthToken,
} from "../authSlice";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  mfa_enabled?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
  enableMFA?: boolean;
}

interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  userType: string;
  profilePicture?: File;
  mfaEnabled?: boolean;
  termsAccepted: boolean;
}

interface RegisterResponse {
  user: User;
  token?: string;
  access?: string;
  refresh?: string;
  refreshToken?: string;
  message: string;
  requiresVerification?: boolean;
  verificationEmailSent?: boolean;
}

interface LoginResponse {
  user: User;
  token: string;
  access?: string;
  refresh?: string;
  refreshToken?: string;
  requiresMFA?: boolean;
  tempToken?: string;
  uid?: string;
  mfaMethods?: string[];
}

interface MFASetupVerifyCredentials {
  token: string;
}

interface VerifyMFACredentials {
  token: string;
  tempToken: string;
  uid: string;
}

interface RefreshTokenResponse {
  token: string;
  access?: string;
}

interface MFASetupRequest {
  enable: boolean;
  backup_codes_acknowledged?: boolean;
}

interface MFASetupResponse {
  status: string;
  secret: string;
  uri: string;
  backup_codes: string[];
  message: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "auth/login/",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any): LoginResponse => ({
        ...response,
        token: response.access || response.token,
        refreshToken: response.response || response.refreshToken,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data.requiresMFA) {
            dispatch(
              setMFARequired({
                tempToken: data.tempToken!,
                uid: data.uid!,
                mfaMethods: data.mfaMethods,
              })
            );
          } else {
            dispatch(
              setCredentials({
                user: data.user,
                token: data.token,
                refreshToken: data.refreshToken,
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

        formData.append("first_name", credentials.firstName);
        formData.append("last_name", credentials.lastName);
        formData.append("email", credentials.email);
        formData.append("phone_number", credentials.phoneNumber || "");
        formData.append("password", credentials.password);
        formData.append("confirm_password", credentials.confirmPassword);
        formData.append("user_type", credentials.userType);
        formData.append(
          "mfa_enabled",
          credentials.mfaEnabled ? "true" : "false"
        );
        formData.append(
          "terms_accepted",
          credentials.termsAccepted ? "true" : "false"
        );

        // Add profile picture if provided
        if (
          credentials.profilePicture &&
          credentials.profilePicture instanceof File
        ) {
          formData.append("profile_picture", credentials.profilePicture);
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
      transformResponse: (response: any): RegisterResponse => ({
        ...response,
        token: response.access || response.token,
        refreshToken: response.refresh || response.refreshToken,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // If registration returns a token (auto-login), set credentials
          if (data.token && data.user) {
            dispatch(
              setCredentials({
                user: data.user,
                token: data.token,
                refreshToken: data.refreshToken,
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

    verifyMFA: builder.mutation<LoginResponse, VerifyMFACredentials>({
      query: (credentials) => ({
        url: "auth/mfa/verify/",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any): LoginResponse => ({
        ...response,
        token: response.access || response.token,
        refreshToken: response.refresh || response.refreshToken,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              token: data.token,
              refreshToken: data.refreshToken,
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

    verifyMFASetup: builder.mutation<
      { status: string; message: string },
      MFASetupVerifyCredentials
    >({
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

    verifyToken: builder.query<{ valid: boolean }, void>({
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
      transformResponse: (response: any): RefreshTokenResponse => ({
        token: response.access || response.token,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setAuthToken({
              token: data.token,
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

    changePassword: builder.mutation<
      { message: string },
      { current_password: string; new_password: string }
    >({
      query: (credentials) => ({
        url: "auth/change-password/",
        method: "POST",
        body: credentials,
      }),
    }),

    requestPasswordReset: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: (data) => ({
        url: "auth/password-reset/",
        method: "POST",
        body: data,
      }),
    }),

    confirmPasswordReset: builder.mutation<
      { message: string },
      { token: string; new_password: string }
    >({
      query: (data) => ({
        url: "auth/password-reset/confirm/",
        method: "POST",
        body: data,
      }),
    }),
    verifyEmail: builder.mutation<{ message: string }, { token: string }>({
      query: (data) => ({
        url: "auth/verify-email/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    resendVerificationEmail: builder.mutation<
      { message: string },
      { email: string }
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

export type { User, RegisterCredentials, RegisterResponse };
