import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  useGetRecentNotificationsQuery,
  useGetUnreadCountQuery,
  notificationsApi
} from '../redux/features/api/notifications/notificationsApi';

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => void;
  clearCache: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  
  const { 
    data: notifications = [], 
    isLoading,
    refetch: refetchNotifications 
  } = useGetRecentNotificationsQuery();
  
  const { 
    data: unreadCountData,
    refetch: refetchUnreadCount 
  } = useGetUnreadCountQuery();

  const refreshNotifications = useCallback(() => {
    refetchNotifications();
    refetchUnreadCount();
  }, [refetchNotifications, refetchUnreadCount]);

  const clearCache = useCallback(() => {
    dispatch(notificationsApi.util.invalidateTags(['Notifications']));
  }, [dispatch]);

  // Auto-refresh notifications every 30 seconds when tab is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshNotifications();
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      interval = setInterval(() => {
        if (!document.hidden) {
          refreshNotifications();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshNotifications]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount: unreadCountData?.count || 0,
    isLoading,
    refreshNotifications,
    clearCache
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};