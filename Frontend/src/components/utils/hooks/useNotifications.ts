import { useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { 
  useGetUnreadCountQuery,
  notificationsApi,
  type Notification 
} from '../../redux/features/api/notifications';
import { useDispatch } from 'react-redux';
import { useToast } from '../Toast';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { data: unreadCount, refetch: refetchUnreadCount } = useGetUnreadCountQuery();

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