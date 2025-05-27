import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FetchBaseQueryError,
  BaseQueryApi,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../../store";
import { logout, setAuthToken } from "../../../features/auth/authSlice";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Define types for your API responses
interface TokenRefreshResponse {
  token: string;
}

interface ErrorResponse {
  status: number;
  data: {
    message?: string;
    code?: string;
  };
}

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
  credentials: "include",
});

const baseQueryWithReauth = async (
  args: any,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  let result = await baseQuery(args, api, extraOptions);

  // Check for 401 Unauthorized
  if ((result?.error as FetchBaseQueryError)?.status === 401) {
    console.log("Refreshing token...");

    const refreshResult = await baseQuery(
      { url: "/auth/token/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Store the new token
      const { token } = refreshResult.data as TokenRefreshResponse;
      api.dispatch(setAuthToken(token));

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed - logout the user
      api.dispatch(logout());

      // Optionally redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  // Handle other error cases
  if (result.error) {
    const error = result.error as FetchBaseQueryError;
    console.error("API Error:", error);

    // You can add more specific error handling here
    if (error.status === 403) {
      // Handle forbidden errors
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "User", "MFA"], // Added MFA tag type
  endpoints: () => ({}),
  // Add global configuration
  keepUnusedDataFor: 30, // Keep unused data for 30 seconds
  refetchOnMountOrArgChange: true, // Better cache behavior
});

// Utility type for API error responses
export type ApiError = {
  status: number;
  data: {
    message?: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
};
