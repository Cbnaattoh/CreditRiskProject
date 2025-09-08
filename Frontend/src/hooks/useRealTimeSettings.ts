import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../components/utils/hooks';
import { selectIsAuthenticated } from '../components/redux/features/auth/authSlice';
import { 
  useGetUserPreferencesQuery,
  useGetUserSessionsQuery,
  useGetSecurityEventsQuery,
  useGetSettingsOverviewQuery,
  settingsApi
} from '../components/redux/features/api/settings/settingsApi';
import { 
  useGetEnhancedUserProfileQuery
} from '../components/redux/features/user/userApi';

interface RealTimeConfig {
  enablePolling?: boolean;
  customIntervals?: {
    preferences?: number;
    sessions?: number;
    securityEvents?: number;
    overview?: number;
    profile?: number;
  };
  onDataUpdate?: (type: string, data: any) => void;
}

export const useRealTimeSettings = (config: RealTimeConfig = {}) => {
  const dispatch = useDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [isActive, setIsActive] = useState(config.enablePolling ?? true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);

  // Only enable polling if user is authenticated
  const shouldSkip = !isAuthenticated;

  // Data queries with custom polling intervals if provided
  const preferencesQuery = useGetUserPreferencesQuery(undefined, {
    skip: shouldSkip,
    pollingInterval: isActive && !shouldSkip ? (config.customIntervals?.preferences || 90000) : 0,
    refetchOnFocus: false, // Disabled to prevent data loss on tab switch
    refetchOnReconnect: true,
  });

  const sessionsQuery = useGetUserSessionsQuery(undefined, {
    skip: shouldSkip,
    pollingInterval: isActive && !shouldSkip ? (config.customIntervals?.sessions || 60000) : 0,
    refetchOnFocus: false, // Disabled to prevent data loss on tab switch
    refetchOnReconnect: true,
  });

  const securityEventsQuery = useGetSecurityEventsQuery(undefined, {
    skip: shouldSkip,
    pollingInterval: isActive && !shouldSkip ? (config.customIntervals?.securityEvents || 60000) : 0,
    refetchOnFocus: false, // Disabled to prevent data loss on tab switch
    refetchOnReconnect: true,
  });

  const overviewQuery = useGetSettingsOverviewQuery(undefined, {
    skip: shouldSkip,
    pollingInterval: isActive && !shouldSkip ? (config.customIntervals?.overview || 120000) : 0,
    refetchOnFocus: false, // Disabled to prevent data loss on tab switch
    refetchOnReconnect: true,
  });

  const profileQuery = useGetEnhancedUserProfileQuery(undefined, {
    skip: shouldSkip || !isActive,
    // Reduced polling frequency to minimize sidebar re-renders
    pollingInterval: isActive && !shouldSkip ? (config.customIntervals?.profile || 300000) : 0, // 5 minutes
    refetchOnFocus: false, // Disabled to prevent data loss on tab switch
    refetchOnReconnect: true,
  });

  // Track data updates and trigger callbacks
  useEffect(() => {
    if (preferencesQuery.data && config.onDataUpdate) {
      config.onDataUpdate('preferences', preferencesQuery.data);
      setLastUpdate(new Date());
    }
  }, [preferencesQuery.data]);

  useEffect(() => {
    if (sessionsQuery.data && config.onDataUpdate) {
      config.onDataUpdate('sessions', sessionsQuery.data);
      setLastUpdate(new Date());
    }
  }, [sessionsQuery.data]);

  useEffect(() => {
    if (securityEventsQuery.data && config.onDataUpdate) {
      config.onDataUpdate('securityEvents', securityEventsQuery.data);
      setLastUpdate(new Date());
    }
  }, [securityEventsQuery.data]);

  useEffect(() => {
    if (overviewQuery.data && config.onDataUpdate) {
      config.onDataUpdate('overview', overviewQuery.data);
      setLastUpdate(new Date());
    }
  }, [overviewQuery.data]);

  useEffect(() => {
    if (profileQuery.data && config.onDataUpdate) {
      config.onDataUpdate('profile', profileQuery.data);
      setLastUpdate(new Date());
    }
  }, [profileQuery.data]);

  // Manual refresh function
  const refreshAll = async () => {
    const promises = [
      preferencesQuery.refetch(),
      sessionsQuery.refetch(),
      securityEventsQuery.refetch(),
      overviewQuery.refetch(),
      profileQuery.refetch(),
    ];

    try {
      await Promise.allSettled(promises);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Enhanced cache invalidation
  const invalidateCache = (tags?: string[]) => {
    if (tags) {
      tags.forEach(tag => {
        dispatch(settingsApi.util.invalidateTags([tag]));
      });
    } else {
      // Invalidate all settings-related cache
      dispatch(settingsApi.util.invalidateTags([
        'UserPreferences', 
        'UserSessions', 
        'SecurityEvents', 
        'SettingsOverview', 
        'UserProfile'
      ]));
    }
  };

  // Start/stop polling
  const startPolling = () => setIsActive(true);
  const stopPolling = () => setIsActive(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(clearInterval);
    };
  }, []);

  // Connection status monitoring
  const isConnected = !preferencesQuery.isError && !sessionsQuery.isError && 
                     !securityEventsQuery.isError && !overviewQuery.isError && 
                     !profileQuery.isError;

  const isLoading = preferencesQuery.isLoading || sessionsQuery.isLoading || 
                   securityEventsQuery.isLoading || overviewQuery.isLoading || 
                   profileQuery.isLoading;

  return {
    // Data
    preferences: preferencesQuery.data,
    sessions: sessionsQuery.data,
    securityEvents: securityEventsQuery.data,
    overview: overviewQuery.data,
    profile: profileQuery.data,

    // Status
    isActive,
    isConnected,
    isLoading,
    lastUpdate,

    // Controls
    startPolling,
    stopPolling,
    refreshAll,
    invalidateCache,

    // Individual query controls
    queries: {
      preferences: preferencesQuery,
      sessions: sessionsQuery,
      securityEvents: securityEventsQuery,
      overview: overviewQuery,
      profile: profileQuery,
    }
  };
};

// Real-time status hook for UI indicators
export const useRealTimeStatus = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [syncCount, setSyncCount] = useState(0);

  const realTimeData = useRealTimeSettings({
    onDataUpdate: (type, data) => {
      setStatus('syncing');
      setSyncCount(prev => prev + 1);
      
      // Show connected status after brief syncing indication
      setTimeout(() => setStatus('connected'), 500);
    }
  });

  return {
    status,
    syncCount,
    lastUpdate: realTimeData.lastUpdate,
    isConnected: realTimeData.isConnected,
    refreshAll: realTimeData.refreshAll,
  };
};

// Performance-optimized hook for specific components
export const useOptimizedRealTime = (components: string[], customInterval?: number) => {
  const config: RealTimeConfig = {
    enablePolling: true,
    customIntervals: {}
  };

  // Set custom intervals based on component needs
  if (customInterval) {
    components.forEach(component => {
      switch (component) {
        case 'dashboard':
          config.customIntervals!.overview = customInterval;
          break;
        case 'security':
          config.customIntervals!.sessions = customInterval;
          config.customIntervals!.securityEvents = customInterval;
          break;
        case 'preferences':
          config.customIntervals!.preferences = customInterval;
          break;
        case 'account':
          config.customIntervals!.profile = customInterval;
          break;
      }
    });
  }

  return useRealTimeSettings(config);
};