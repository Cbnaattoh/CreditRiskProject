import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FetchBaseQueryError,
  BaseQueryApi,
  FetchArgs,
} from "@reduxjs/toolkit/query/react";

import type { RootState } from "../../../store";
import {
  // logout,
  // setAuthTokenString,
  // setAuthToken,
  refreshTokenSuccess,
  refreshTokenFailure,
  selectIsTokenValid,
  selectAuthToken,
  selectRefreshToken,
  isTokenExpired,
} from "../../../features/auth/authSlice";

// Environment-based API root
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    const state = getState() as RootState;
    const token = selectAuthToken(state);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Accept", "application/json");

    const formDataEndpoints = ["register"];
    if (!formDataEndpoints.includes(endpoint as string)) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    return headers;
  },
  validateStatus: (response) => response.status >= 200 && response.status < 300,
});

const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  console.log("🔵 Making API request:", args);

  const state = api.getState() as RootState;
  const currentToken = selectAuthToken(state);
  const isTokenValid = selectIsTokenValid(state);

  console.log("🔵 Token state:", {
    hasToken: !!currentToken,
    isValid: isTokenValid,
    isExpired: currentToken ? isTokenExpired(currentToken) : "N/A",
  });

  if (currentToken && !isTokenValid) {
    console.warn("🟡 Token expired before request. Attempting refresh...");
    const refreshResult = await attemptTokenRefresh(api, extraOptions);
    if (!refreshResult) {
      return {
        error: {
          status: 401,
          data: { detail: "Token expired and refresh failed" },
        },
      };
    }
  }

  let result = await baseQuery(args, api, extraOptions);

  const error = result?.error as FetchBaseQueryError | undefined;
  console.log("🔵 API response:", { error: error?.status, data: result?.data });

  // SECURITY: Handle password change requirement responses
  if (error?.status === 403) {
    const errorData = error.data as any;
    if (errorData?.code === 'PASSWORD_CHANGE_REQUIRED' || errorData?.code === 'PASSWORD_EXPIRED') {
      console.warn("🔴 Password change required. Forcing user to change password page.");
      
      // Force navigation to password change page
      if (typeof window !== 'undefined') {
        window.location.href = '/change-password';
      }
      
      return {
        error: {
          status: 403,
          data: { 
            detail: "Password change required. Redirecting to password change page.",
            code: errorData.code
          },
        },
      };
    }
  }

  if (error?.status === 401) {
    console.warn("🟡 Received 401. Attempting token refresh...");

    const refreshResult = await attemptTokenRefresh(api, extraOptions);

    if (refreshResult) {
      console.log(
        "🟢 Token refreshed successfully. Retrying original request..."
      );
      result = await baseQuery(args, api, extraOptions);

      console.log("🔵 Retry result:", {
        error: (result?.error as any)?.status,
        success: !result?.error,
      });
    } else {
      console.error("🔴 Token refresh failed. User will be logged out.");
    }
  }

  // Handle HTML error responses
  if (
    error &&
    typeof error.data === "string" &&
    error.data.includes("<!DOCTYPE html>")
  ) {
    console.warn("🟡 Received HTML error response, converting to JSON error");
    return {
      error: {
        status: error.status,
        data: {
          detail: "Internal server error",
        },
      },
    };
  }

  return result;
};

// Extracted token refresh logic for reusability
const attemptTokenRefresh = async (
  api: BaseQueryApi,
  extraOptions: {}
): Promise<boolean> => {
  const state = api.getState() as RootState;
  let refreshToken = selectRefreshToken(state);

  console.log(
    "🔵 Refresh token from Redux state:",
    refreshToken ? "EXISTS" : "NULL"
  );

  // Fallback to localStorage if not in Redux state
  if (!refreshToken && typeof window !== "undefined") {
    refreshToken = localStorage.getItem("refreshToken");
    console.log(
      "🔵 Refresh token from localStorage:",
      refreshToken ? "EXISTS" : "NULL"
    );
  }

  if (!refreshToken) {
    console.error("🔴 No refresh token available. Forcing logout.");
    api.dispatch(refreshTokenFailure());
    redirectToLogin();
    return false;
  }

  // Check if refresh token is also expired
  if (isTokenExpired(refreshToken)) {
    console.error("🔴 Refresh token is also expired. Forcing logout.");
    api.dispatch(refreshTokenFailure());
    redirectToLogin();
    return false;
  }

  console.log("🔵 Attempting token refresh...");

  try {
    const refreshResponse = await baseQuery(
      {
        url: "auth/token/refresh/",
        method: "POST",
        body: { refresh: refreshToken },
      },
      api,
      extraOptions
    );

    console.log("🔵 Refresh response:", {
      error: refreshResponse.error,
      data: refreshResponse.data,
      status: (refreshResponse.error as any)?.status,
    });

    // Check if refresh failed
    if (refreshResponse.error) {
      const refreshError = refreshResponse.error as FetchBaseQueryError;
      console.error("🔴 Token refresh failed with error:", refreshError);

      // Check if refresh token is also invalid
      if (refreshError.status === 401) {
        console.error("🔴 Refresh token is invalid/expired. Logging out.");
      } else {
        console.error(
          "🔴 Token refresh failed with status:",
          refreshError.status
        );
      }

      api.dispatch(refreshTokenFailure());
      redirectToLogin();
      return false;
    }

    const refreshData = refreshResponse.data as {
      access?: string;
      refresh?: string;
    };

    console.log("🔵 New tokens received:", {
      access: refreshData?.access ? "EXISTS" : "NULL",
      refresh: refreshData?.refresh ? "EXISTS" : "NULL",
    });

    if (refreshData?.access) {
      // Validate the new token before setting it
      if (isTokenExpired(refreshData.access)) {
        console.error("🔴 Received expired access token from refresh endpoint");
        api.dispatch(refreshTokenFailure());
        redirectToLogin();
        return false;
      }

      // Use the new refresh token actions
      api.dispatch(
        refreshTokenSuccess({
          token: refreshData.access,
          refreshToken: refreshData.refresh,
        })
      );

      console.log("🟢 Tokens updated successfully.");
      return true;
    } else {
      console.error("🔴 Token refresh succeeded but no access token received.");
      console.error("🔴 Full refresh response:", refreshData);
      api.dispatch(refreshTokenFailure());
      redirectToLogin();
      return false;
    }
  } catch (refreshError) {
    console.error(
      "🔴 Token refresh request failed with exception:",
      refreshError
    );
    api.dispatch(refreshTokenFailure());
    redirectToLogin();
    return false;
  }
};

// Helper function to handle logout redirect
const redirectToLogin = () => {
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "User", "MFA", "Report", "ReportTemplate", "ReportSchedule", "ReportKPI", "Analytics"],
  endpoints: () => ({}),
  keepUnusedDataFor: 30,
  refetchOnMountOrArgChange: true,
});

export type ApiError = {
  status: number;
  data: {
    detail?: string;
    message?: string;
    errors?: Record<string, string[]>;
  };
};
