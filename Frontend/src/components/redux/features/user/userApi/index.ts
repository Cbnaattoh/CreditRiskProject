import { apiSlice } from "../../api/baseApi";
import { setUser } from "../userSlice";
import type {
  UserProfile,
  UserProfileResponse,
  //LoginHistoryEntry,
  LoginHistoryResponse,
} from "../types/user";
import { transformUserProfile } from "../types/user";

interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  company?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  profile_picture?: File;
}

interface UserUpdateResponse {
  message?: string;
  user?: UserProfile;
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
      transformResponse: (response: any) => transformUserProfile(response),
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
        if (updateData.company !== undefined) {
          formData.append("company", updateData.company);
        }
        if (updateData.job_title !== undefined) {
          formData.append("job_title", updateData.job_title);
        }
        if (updateData.department !== undefined) {
          formData.append("department", updateData.department);
        }
        if (updateData.bio !== undefined) {
          formData.append("bio", updateData.bio);
        }
        if (updateData.timezone !== undefined) {
          formData.append("timezone", updateData.timezone);
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
      query: (params?: LoginHistoryParams) => {
        const searchParams = new URLSearchParams();

        if (params?.page) {
          searchParams.append("page", params.page.toString());
        }
        if (params?.page_size) {
          searchParams.append("page_size", params.page_size.toString());
        }
        if (params?.ordering) {
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

export type { UserUpdateRequest, UserUpdateResponse, LoginHistoryParams };
