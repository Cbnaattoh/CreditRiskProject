import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FetchBaseQueryError,
  BaseQueryApi,
  FetchArgs,
} from "@reduxjs/toolkit/query/react";

import type { RootState } from "../../../store";
import { logout, setAuthTokenString } from "../../../features/auth/authSlice";

// ✅ Environment-based API root
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Accept", "application/json");

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
  validateStatus: (response) => response.status < 500,
});

const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  let result = await baseQuery(args, api, extraOptions);

  const error = result?.error as FetchBaseQueryError | undefined;

  // ✅ Automatic reauth on 401
  if (error?.status === 401) {
    console.warn("Access token expired. Attempting refresh...");

    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      console.warn("No refresh token. Forcing logout.");
      api.dispatch(logout());
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return result;
    }

    const refreshResponse = await baseQuery(
      {
        url: "auth/token/refresh/",
        method: "POST",
        body: { refresh: refreshToken },
      },
      api,
      extraOptions
    );

    const refreshData = refreshResponse.data as { access?: string };

    if (refreshData?.access) {
      api.dispatch(setAuthTokenString(refreshData.access));

      result = await baseQuery(args, api, extraOptions);
    } else {
      console.error("Token refresh failed. Logging out.");
      api.dispatch(logout());
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  // 🧼 Clean up HTML error pages (fallback errors)
  if (
    error &&
    typeof error.data === "string" &&
    error.data.includes("<!DOCTYPE html>")
  ) {
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

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "User", "MFA"],
  endpoints: () => ({}),
  keepUnusedDataFor: 30,
  refetchOnMountOrArgChange: true,
});

// ✅ Shared API error type
export type ApiError = {
  status: number;
  data: {
    detail?: string;
    message?: string;
    errors?: Record<string, string[]>;
  };
};
