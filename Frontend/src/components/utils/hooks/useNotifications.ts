import { useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { 
  useGetUnreadCountQuery,
  notificationsApi,
  type Notification 
} from '../../redux/features/api/notifications';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '../Toast';
import type { RootState } from '../../redux/store';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const { data: unreadCount, refetch: refetchUnreadCount } = useGetUnreadCountQuery(undefined, {
    // Only query when authenticated
    skip: !isAuthenticated,
    // Refetch every 30 seconds to ensure fresh notification data
    pollingInterval: 30000,
    // Refetch when component refocuses
    refetchOnFocus: true,
    // Refetch when reconnecting
    refetchOnReconnect: true
  });

  // Refetch notifications when user changes (login/logout)
  useEffect(() => {
    if (isAuthenticated && user) {
      refetchUnreadCount();
      // Also invalidate all notification cache to force fresh data
      dispatch(notificationsApi.util.invalidateTags(['Notification']));
    }
  }, [isAuthenticated, user?.id, refetchUnreadCount, dispatch]);

  const handleNotificationMessage = useCallback((message: any) => {
    if (message.type === 'notify' && message.data) {
      const notification: Notification = message.data;
      
      // Show toast notification for new notifications
      showToast(
        `${notification.title}: ${notification.message}`,
        getNotificationToastType(notification.notification_type),
        5000
      );

      // Invalidate and refetch notification queries to update the UI
      dispatch(notificationsApi.util.invalidateTags(['Notification']));
      refetchUnreadCount();
    }
  }, [dispatch, refetchUnreadCount, showToast]);

  const { isConnected, connectionError } = useWebSocket('/ws/notifications/', {
    onMessage: handleNotificationMessage,
    onConnect: () => {
      console.log('Notifications WebSocket connected');
    },
    onDisconnect: () => {
      console.log('Notifications WebSocket disconnected');
    },
    onError: (error) => {
      console.error('Notifications WebSocket error:', error);
    },
  });

  return {
    unreadCount: unreadCount?.count || 0,
    isConnected,
    connectionError,
    refetchNotifications: refetchUnreadCount,
  };
};

const getNotificationToastType = (notificationType: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (notificationType) {
    case 'APPLICATION_SUBMITTED':
    case 'DOCUMENT_UPLOADED':
      return 'info';
    case 'STATUS_CHANGE':
      return 'warning';
    case 'RISK_ASSESSED':
    case 'DECISION_MADE':
      return 'success';
    case 'SYSTEM_ALERT':
      return 'error';
    default:
      return 'info';
  }
};