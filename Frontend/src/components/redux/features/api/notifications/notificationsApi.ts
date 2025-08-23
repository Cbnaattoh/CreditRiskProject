import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../store';

// Environment-based API root
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface Notification {
  id: number;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_object_id?: number;
  related_content_type?: string;
  time_ago: string;
}

export interface AuditLog {
  id: number;
  user: number;
  user_email: string;
  action: string;
  action_display: string;
  model: string;
  object_id: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  metadata: Record<string, any>;
  time_ago: string;
}

export interface NotificationCreateRequest {
  recipient: number;
  notification_type: string;
  title: string;
  message: string;
  related_object_id?: number;
  related_content_type?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllReadResponse {
  updated: number;
}

export interface ClearReadResponse {
  deleted: number;
}

export interface DeleteNotificationResponse {
  success: boolean;
  message?: string;
}

export interface BulkDeleteResponse {
  deleted: number;
  message?: string;
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");

      return headers;
    },
  }),
  tagTypes: ['Notification', 'AuditLog'],
  endpoints: (builder) => ({
    // Get all notifications for current user
    getNotifications: builder.query<Notification[], void>({
      query: () => 'notifications/',
      providesTags: ['Notification'],
    }),

    // Get unread notifications
    getUnreadNotifications: builder.query<Notification[], void>({
      query: () => 'notifications/unread/',
      providesTags: ['Notification'],
    }),

    // Get unread notification count
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => 'notifications/unread_count/',
      providesTags: ['Notification'],
    }),

    // Get recent notifications (last 30 days)
    getRecentNotifications: builder.query<Notification[], void>({
      query: () => 'notifications/recent/',
      providesTags: ['Notification'],
    }),


    // Mark specific notification as read
    markNotificationRead: builder.mutation<Notification, number>({
      query: (id) => ({
        url: `notifications/${id}/mark_read/`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Mark all notifications as read
    markAllNotificationsRead: builder.mutation<MarkAllReadResponse, void>({
      query: () => ({
        url: 'notifications/mark_all_read/',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Clear all read notifications
    clearReadNotifications: builder.mutation<ClearReadResponse, void>({
      query: () => ({
        url: 'notifications/clear_read/',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Delete individual notification
    deleteNotification: builder.mutation<DeleteNotificationResponse, number>({
      query: (id) => ({
        url: `notifications/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Delete all notifications (with optional filter)
    deleteAllNotifications: builder.mutation<BulkDeleteResponse, { read_only?: boolean }>({
      query: (params) => ({
        url: 'notifications/bulk_delete/',
        method: 'DELETE',
        body: params,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Archive notification (soft delete - industry standard)
    archiveNotification: builder.mutation<DeleteNotificationResponse, number>({
      query: (id) => ({
        url: `notifications/${id}/archive/`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Bulk archive notifications
    bulkArchiveNotifications: builder.mutation<BulkDeleteResponse, { notification_ids: number[] }>({
      query: (params) => ({
        url: 'notifications/bulk_archive/',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Create notification (admin only)
    createNotification: builder.mutation<Notification, NotificationCreateRequest>({
      query: (notification) => ({
        url: 'notifications/',
        method: 'POST',
        body: notification,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Get audit logs
    getAuditLogs: builder.query<AuditLog[], void>({
      query: () => 'audit-logs/',
      providesTags: ['AuditLog'],
    }),

    // Get recent audit logs
    getRecentAuditLogs: builder.query<AuditLog[], void>({
      query: () => 'audit-logs/recent/',
      providesTags: ['AuditLog'],
    }),

    // Get audit logs by action type
    getAuditLogsByAction: builder.query<AuditLog[], string>({
      query: (action) => `audit-logs/by_action/?action=${action}`,
      providesTags: ['AuditLog'],
    }),

    // Auto-cleanup old read notifications (older than X days)
    autoCleanupNotifications: builder.mutation<ClearReadResponse, { days_old?: number }>({
      query: (params) => ({
        url: 'notifications/auto_cleanup/',
        method: 'DELETE',
        body: params,
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationsQuery,
  useGetUnreadCountQuery,
  useGetRecentNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearReadNotificationsMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useArchiveNotificationMutation,
  useBulkArchiveNotificationsMutation,
  useCreateNotificationMutation,
  useGetAuditLogsQuery,
  useGetRecentAuditLogsQuery,
  useGetAuditLogsByActionQuery,
  useAutoCleanupNotificationsMutation,
} = notificationsApi;