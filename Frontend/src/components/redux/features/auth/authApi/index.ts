import { apiSlice } from "../../api/baseApi";

interface LoginCredentials {
  email: string;
  password: string;
  enableMFA?: boolean;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    mfa_enabled: boolean;
  };
  token: string;
  refreshToken?: string;
  requiresMFA?: boolean;
  tempToken?: string;
  mfaMethods?: string[];
}

interface VerifyMFACredentials {
  code: string;
  tempToken: string;
}

interface RefreshTokenResponse {
  token: string;
}

interface MFASetupResponse {
  qr_code: string;
  secret: string;
  backup_codes: string[];
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
        token: response.access,
      }),
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

    verifyMFA: builder.mutation<LoginResponse, VerifyMFACredentials>({
      query: (credentials) => ({
        url: "auth/mfa/verify/",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "MFA"],
    }),
    setupMFA: builder.mutation<MFASetupResponse, {enable: boolean}>({
      query: ({enable}) => ({
        url: "auth/mfa/setup/",
        method: "POST",
        body: { enable },
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
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "auth/logout/",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
    verifyToken: builder.mutation<{ valid: boolean }, void>({
      query: () => ({
        url: "auth/mfa/verify/",
        method: "POST",
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: "auth/refresh/",
        method: "POST",
      }),
    }),
    getCurrentUser: builder.query({
      query: () => "auth/me/",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyMFAMutation,
  useSetupMFAMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useVerifyTokenMutation,
  useRefreshTokenMutation,
} = authApi;
