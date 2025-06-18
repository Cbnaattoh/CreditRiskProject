import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FetchBaseQueryError,
  BaseQueryApi,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../../store";
import { logout, setAuthTokenString } from "../../../features/auth/authSlice";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    console.log("Current auth state in prepareHeaders:", {
      token: token,
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user,
    });

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      console.log("Authorization header set with token");
    } else {
      console.warn("No token available for request");
    }

    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    return headers;
  },
  credentials: "include",
  validateStatus: (response) => response.status < 500,
});

const baseQueryWithReauth = async (
  args: any,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  let result = await baseQuery(args, api, extraOptions);

  if ((result?.error as FetchBaseQueryError)?.status === 401) {
    console.log("Refreshing token...");
    const refreshResult = await baseQuery(
      { url: "auth/token/refresh/", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { token } = refreshResult.data as { token: string };
      api.dispatch(setAuthTokenString(token));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  if (result.error) {
    const error = result.error as FetchBaseQueryError;
    console.error("API Error:", error);

    // Transform HTML errors to JSON format
    if (
      typeof error.data === "string" &&
      error.data.startsWith("<!DOCTYPE html>")
    ) {
      return {
        error: {
          status: error.status,
          data: { detail: "Internal server error" },
        },
      };
    }
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

// Utility type for API error responses
export type ApiError = {
  status: number;
  data: {
    message?: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
};
