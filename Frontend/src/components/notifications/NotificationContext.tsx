import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useNotifications } from '../utils/hooks/useNotifications';
import { 
  useGetRecentNotificationsQuery,
  notificationsApi 
} from '../redux/features/api/notifications/notificationsApi';
import { useDispatch } from 'react-redux';

interface NotificationContextType {
  unreadCount: number;
  isConnected: boolean;
  refetchNotifications: () => void;
  invalidateNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { unreadCount, isConnected, refetchNotifications } = useNotifications();
  const { refetch } = useGetRecentNotificationsQuery();
  const dispatch = useDispatch();

  const invalidateNotifications = useCallback(() => {
    // Invalidate all notification-related cache entries
    dispatch(notificationsApi.util.invalidateTags(['Notification']));
    refetchNotifications();
    refetch();
  }, [dispatch, refetchNotifications, refetch]);

  const contextValue: NotificationContextType = {
    unreadCount,
    isConnected,
    refetchNotifications: invalidateNotifications,
    invalidateNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};