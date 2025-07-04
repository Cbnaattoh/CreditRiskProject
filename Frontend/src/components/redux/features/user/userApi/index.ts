import { apiSlice } from "../../api/baseApi";
import { setUser } from "../userSlice";

// Base interfaces
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  mfa_fully_configured?: boolean;
  date_joined?: string;
  last_login?: string;
}

interface BaseResponse {
  message?: string;
}

// User profile interfaces
interface UserProfileResponse extends User {}

interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: File;
}

interface UserUpdateResponse extends BaseResponse {
  user?: User;
}

// Login history interfaces
interface LoginHistoryEntry {
  id: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  login_time: string;
  is_successful: boolean;
  device_info?: string;
}

interface LoginHistoryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LoginHistoryEntry[];
}

interface LoginHistoryParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: "users/me/",
        method: "GET",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch (error) {
          console.error("Get user profile failed:", error);
        }
      },
      providesTags: ["User"],
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "User profile server error" },
          };
        }
        return response;
      },
    }),

    updateUserProfile: builder.mutation<UserUpdateResponse, UserUpdateRequest>({
      query: (updateData) => {
        const formData = new FormData();

        if (updateData.first_name !== undefined) {
          formData.append("first_name", updateData.first_name);
        }
        if (updateData.last_name !== undefined) {
          formData.append("last_name", updateData.last_name);
        }
        if (updateData.phone_number !== undefined) {
          formData.append("phone_number", updateData.phone_number);
        }

        if (
          updateData.profile_picture &&
          updateData.profile_picture instanceof File
        ) {
          formData.append("profile_picture", updateData.profile_picture);
        }

        return {
          url: "users/me/update/",
          method: "PATCH",
          body: formData,
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.user) {
            dispatch(setUser(data.user));
          }
        } catch (error) {
          console.error("Update user profile failed:", error);
        }
      },
      invalidatesTags: ["User"],
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Update profile server error" },
          };
        }
        return response;
      },
    }),

    getUserLoginHistory: builder.query<
      LoginHistoryResponse,
      LoginHistoryParams | void
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.page) {
          searchParams.append("page", params.page.toString());
        }
        if (params.page_size) {
          searchParams.append("page_size", params.page_size.toString());
        }
        if (params.ordering) {
          searchParams.append("ordering", params.ordering);
        }

        const queryString = searchParams.toString();
        const url = `users/me/login-history/${
          queryString ? `?${queryString}` : ""
        }`;

        return {
          url,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "User" as const,
                id,
              })),
              { type: "User", id: "LOGIN_HISTORY" },
            ]
          : [{ type: "User", id: "LOGIN_HISTORY" }],
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Login history server error" },
          };
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUserLoginHistoryQuery,
} = userApi;

export type {
  User,
  UserProfileResponse,
  UserUpdateRequest,
  UserUpdateResponse,
  LoginHistoryEntry,
  LoginHistoryResponse,
  LoginHistoryParams,
  BaseResponse,
};
