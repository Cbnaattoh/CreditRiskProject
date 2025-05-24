import { apiSlice } from "../../api/baseApi";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  refreshToken?: string;
  requires2FA?: boolean;
  tempToken?: string;
}

interface Verify2FACredentials {
  code: string;
  tempToken: string;
}

interface RefreshTokenResponse {
  token: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    verify2FA: builder.mutation<LoginResponse, Verify2FACredentials>({
      query: (credentials) => ({
        url: "/auth/verify-2fa",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
    verifyToken: builder.mutation<{ valid: boolean }, void>({
      query: () => ({
        url: "/auth/verify-token",
        method: "POST",
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),
    getCurrentUser: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerify2FAMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useVerifyTokenMutation,
  useRefreshTokenMutation,
} = authApi;
