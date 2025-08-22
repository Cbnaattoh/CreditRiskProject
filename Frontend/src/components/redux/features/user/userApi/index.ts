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
  // Enhanced fields for credit risk assessment
  phone_secondary?: string;
  address?: string;
  date_of_birth?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
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

    // Enhanced user profile query with real-time updates for credit risk system
    getEnhancedUserProfile: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: "users/me/",
        method: "GET",
      }),
      transformResponse: (response: any) => transformUserProfile(response),
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          
          // Only dispatch user update if data has actually changed to prevent unnecessary re-renders
          const currentUser = (getState() as any).auth?.user;
          
          // Compare only key fields that affect sidebar rendering
          const keyFields = ['id', 'email', 'first_name', 'last_name', 'user_type', 'roles', 'permissions'];
          const hasChanged = !currentUser || keyFields.some(field => 
            currentUser[field] !== data[field]
          );
          
          if (hasChanged) {
            dispatch(setUser(data));
          }
        } catch (error) {
          console.error("Get enhanced user profile failed:", error);
        }
      },
      providesTags: ["User", "UserProfile"],
      // Removed aggressive polling to prevent sidebar re-renders
      // Real-time updates will be handled by useRealTimeSettings hook when needed
      refetchOnReconnect: true,
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Enhanced user profile server error" },
          };
        }
        return response;
      },
    }),

    // Upload profile picture endpoint
    uploadProfilePicture: builder.mutation<UserUpdateResponse, FormData>({
      query: (formData) => ({
        url: "users/me/",
        method: "PATCH",
        body: formData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.user) {
            dispatch(setUser(data.user));
          }
        } catch (error) {
          console.error("Upload profile picture failed:", error);
        }
      },
      invalidatesTags: ["User", "UserProfile"],
      transformErrorResponse: (response) => {
        if (
          typeof response.data === "string" &&
          response.data.includes("<!DOCTYPE html>")
        ) {
          return {
            status: response.status,
            data: { detail: "Profile picture upload server error" },
          };
        }
        return response;
      },
    }),

    updateUserProfile: builder.mutation<UserUpdateResponse, UserUpdateRequest>({
      query: (updateData) => {
        // Check if we have a file upload (profile_picture)
        const hasFileUpload = updateData.profile_picture && updateData.profile_picture instanceof File;
        
        if (hasFileUpload) {
          // Use FormData for file uploads
          const formData = new FormData();

          // Only append non-empty string values
          Object.entries(updateData).forEach(([key, value]) => {
            if (key === 'profile_picture') {
              if (value instanceof File) {
                formData.append(key, value);
              }
            } else if (value !== undefined && value !== null && value !== '') {
              formData.append(key, String(value));
            }
          });

          return {
            url: "users/me/",
            method: "PATCH",
            body: formData,
          };
        } else {
          // Use JSON for non-file updates
          const jsonData: Record<string, any> = {};
          
          // Only include non-empty values
          Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              jsonData[key] = value;
            }
          });

          return {
            url: "users/me/",
            method: "PATCH",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
          };
        }
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
  useGetEnhancedUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadProfilePictureMutation,
  useGetUserLoginHistoryQuery,
} = userApi;

export type { UserUpdateRequest, UserUpdateResponse, LoginHistoryParams };
