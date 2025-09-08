import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AlertCard from './AlertCard';
import { 
  useGetRecentNotificationsQuery, 
  useGetUnreadCountQuery,
  useGetRecentAuditLogsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useArchiveNotificationMutation,
  useClearReadNotificationsMutation
} from '../../../components/redux/features/api/notifications/notificationsApi';
import { useGetRBACDashboardQuery } from '../../../components/redux/features/api/RBAC/rbacApi';
import { useNotificationContext } from '../../../components/notifications/NotificationProvider';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../components/redux/features/auth/authSlice';

interface SystemAlertsWidgetProps {
  userType: 'admin' | 'staff' | 'client';
  isLoading?: boolean;
}

interface SystemAlert {
  id: string;
  severity: "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  time: string;
  type: 'notification' | 'system' | 'security' | 'ml_processing';
  actionable?: boolean;
  onAction?: () => void;
  notificationId?: number;
  onDelete?: () => void;
  onArchive?: () => void;
}

export const SystemAlertsWidget: React.FC<SystemAlertsWidgetProps> = ({
  userType,
  isLoading = false
}) => {
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'high' | 'security' | 'ml_processing'>('all');
  const [isWelcomeMessageDismissed, setIsWelcomeMessageDismissed] = useState(false);
  const [dismissedSystemAlerts, setDismissedSystemAlerts] = useState<Set<string>>(new Set());
  const [mlProcessingStats, setMlProcessingStats] = useState({
    processing: 2,
    completed_today: 15,
    failed_today: 1,
    avg_processing_time: 45
  });
  
  // Get current user for localStorage key
  const currentUser = useSelector(selectCurrentUser);
  
  // Use notification context for synchronized data
  const { notifications: contextNotifications, refreshNotifications } = useNotificationContext();
  
  // API queries
  const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = useGetRecentNotificationsQuery();
  const { data: unreadCount } = useGetUnreadCountQuery();
  
  // Use context notifications if available, otherwise fallback to direct API
  const currentNotifications = contextNotifications || notifications;
  const { data: auditLogs, isLoading: auditLoading } = useGetRecentAuditLogsQuery();
  const { data: rbacData } = useGetRBACDashboardQuery(undefined, {
    skip: userType !== 'admin'
  });

  // Mutations
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();
  const [archiveNotification] = useArchiveNotificationMutation();
  const [clearReadNotifications] = useClearReadNotificationsMutation();

  // Check localStorage for welcome message and system alerts dismissal state
  useEffect(() => {
    if (currentUser) {
      // Welcome message dismissal (client users only)
      if (userType === 'client') {
        const dismissalKey = `welcomeMessageDismissed_${currentUser.id}`;
        const isDismissed = localStorage.getItem(dismissalKey) === 'true';
        setIsWelcomeMessageDismissed(isDismissed);
      }
      
      // System alerts dismissal (admin users)
      if (userType === 'admin' || userType === 'staff') {
        const systemAlertsKey = `dismissedSystemAlerts_${currentUser.id}`;
        const dismissedAlerts = localStorage.getItem(systemAlertsKey);
        if (dismissedAlerts) {
          try {
            const parsedAlerts = JSON.parse(dismissedAlerts);
            setDismissedSystemAlerts(new Set(parsedAlerts));
          } catch (e) {
            // If parsing fails, start with empty set
            setDismissedSystemAlerts(new Set());
          }
        }
      }
    }
  }, [currentUser, userType]);

  // Handle welcome message dismissal
  const handleDismissWelcomeMessage = () => {
    if (currentUser) {
      const dismissalKey = `welcomeMessageDismissed_${currentUser.id}`;
      localStorage.setItem(dismissalKey, 'true');
      setIsWelcomeMessageDismissed(true);
    }
  };

  // Handle system alert dismissal
  const handleDismissSystemAlert = (alertId: string) => {
    if (currentUser) {
      const newDismissedAlerts = new Set(dismissedSystemAlerts);
      newDismissedAlerts.add(alertId);
      setDismissedSystemAlerts(newDismissedAlerts);
      
      // Save to localStorage
      const systemAlertsKey = `dismissedSystemAlerts_${currentUser.id}`;
      localStorage.setItem(systemAlertsKey, JSON.stringify([...newDismissedAlerts]));
    }
  };

  // Handle reset dismissed alerts (admin only)
  const handleResetDismissedAlerts = () => {
    if (currentUser && (userType === 'admin' || userType === 'staff')) {
      setDismissedSystemAlerts(new Set());
      const systemAlertsKey = `dismissedSystemAlerts_${currentUser.id}`;
      localStorage.removeItem(systemAlertsKey);
    }
  };

  // Create notification action handlers that refresh data
  const handleMarkNotificationRead = async (id: number) => {
    try {
      await markNotificationRead(id).unwrap();
      refreshNotifications(); // Refresh context for synchronization
      // This will automatically invalidate and refetch due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      // This will automatically invalidate and refetch due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id).unwrap();
      // This will automatically invalidate and refetch due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleArchiveNotification = async (id: number) => {
    try {
      await archiveNotification(id).unwrap();
      // This will automatically invalidate and refetch due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const handleClearReadNotifications = async () => {
    try {
      await clearReadNotifications().unwrap();
      // This will automatically invalidate and refetch due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await deleteAllNotifications({}).unwrap();
      // This will automatically invalidate and refetch due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  // Transform backend data to alerts
  const systemAlerts = useMemo(() => {
    const alerts: SystemAlert[] = [];

    // Add notification-based alerts
    if (currentNotifications) {
      currentNotifications.forEach(notification => {
        let severity: SystemAlert['severity'] = 'info';
        
        // Map notification types to severity
        switch (notification.notification_type) {
          case 'SYSTEM_ALERT':
            severity = 'high';
            break;
          case 'ML_PROCESSING_FAILED':
            severity = 'high';
            break;
          case 'STATUS_CHANGE':
          case 'DECISION_MADE':
          case 'ML_PROCESSING_COMPLETED':
          case 'CREDIT_SCORE_GENERATED':
            severity = 'medium';
            break;
          case 'APPLICATION_SUBMITTED':
          case 'DOCUMENT_UPLOADED':
          case 'ML_PROCESSING_STARTED':
            severity = 'low';
            break;
          default:
            severity = 'info';
        }

        const alertType = ['ML_PROCESSING_STARTED', 'ML_PROCESSING_COMPLETED', 'ML_PROCESSING_FAILED', 'CREDIT_SCORE_GENERATED'].includes(notification.notification_type) 
          ? 'ml_processing' 
          : 'notification';

        alerts.push({
          id: `notification-${notification.id}`,
          severity,
          title: notification.title,
          description: notification.message,
          time: notification.time_ago || formatTime(notification.created_at),
          type: alertType,
          actionable: !notification.is_read,
          notificationId: notification.id,
          onAction: () => handleMarkNotificationRead(notification.id),
          onDelete: () => handleDeleteNotification(notification.id),
          onArchive: () => handleArchiveNotification(notification.id)
        });
      });
    }

    // Add RBAC-based system alerts for admins
    if (userType === 'admin' && rbacData) {
      // Alert for expired role assignments
      if (rbacData.summary.expired > 0) {
        alerts.push({
          id: 'expired-roles',
          severity: 'high',
          title: 'Expired Role Assignments',
          description: `${rbacData.summary.expired} role assignments have expired and need immediate attention`,
          time: 'System check',
          type: 'security'
        });
      }

      // Alert for roles expiring soon
      if (rbacData.summary.expiring_soon > 0) {
        alerts.push({
          id: 'expiring-roles',
          severity: 'medium',
          title: 'Roles Expiring Soon',
          description: `${rbacData.summary.expiring_soon} role assignments expire within 7 days`,
          time: 'System check',
          type: 'security'
        });
      }

      // Alert for high activity (dismissible)
      if (rbacData.recent_activity.assignments_24h > 10 && !dismissedSystemAlerts.has('high-activity')) {
        alerts.push({
          id: 'high-activity',
          severity: 'info',
          title: 'High Role Assignment Activity',
          description: `${rbacData.recent_activity.assignments_24h} new role assignments in the last 24 hours`,
          time: 'Last 24 hours',
          type: 'system',
          actionable: true,
          onAction: () => handleDismissSystemAlert('high-activity')
        });
      }

      // Alert for permission check activity (dismissible)
      if (rbacData.recent_activity.permission_checks_24h > 100 && !dismissedSystemAlerts.has('high-permission-activity')) {
        alerts.push({
          id: 'high-permission-activity',
          severity: 'info',
          title: 'High System Activity',
          description: `${rbacData.recent_activity.permission_checks_24h} permission checks performed in the last 24 hours`,
          time: 'Last 24 hours',
          type: 'system',
          actionable: true,
          onAction: () => handleDismissSystemAlert('high-permission-activity')
        });
      }

      // Alert for system status (dismissible)
      if (rbacData.summary.total_users > 0 && !dismissedSystemAlerts.has('system-health')) {
        alerts.push({
          id: 'system-health',
          severity: 'info',
          title: 'System Status Update',
          description: `Managing ${rbacData.summary.total_users} users with ${rbacData.summary.active_assignments} active role assignments`,
          time: 'System overview',
          type: 'system',
          actionable: true,
          onAction: () => handleDismissSystemAlert('system-health')
        });
      }
    }

    // Add ML Processing system alerts
    if (userType === 'admin' || userType === 'staff') {
      // ML Processing queue status (dismissible if info level)
      if (mlProcessingStats.processing > 0) {
        const severity = mlProcessingStats.processing > 5 ? 'medium' : 'info';
        const isDismissible = severity === 'info';
        const alertId = 'ml-processing-queue';
        
        if (!isDismissible || !dismissedSystemAlerts.has(alertId)) {
          alerts.push({
            id: alertId,
            severity,
            title: 'ML Processing Queue',
            description: `${mlProcessingStats.processing} credit applications currently being processed by ML models`,
            time: 'Real-time',
            type: 'ml_processing',
            actionable: isDismissible,
            onAction: isDismissible ? () => handleDismissSystemAlert(alertId) : undefined
          });
        }
      }

      // Daily ML processing summary (dismissible)
      if (mlProcessingStats.completed_today > 0 && !dismissedSystemAlerts.has('ml-daily-summary')) {
        alerts.push({
          id: 'ml-daily-summary',
          severity: 'info',
          title: 'Daily ML Processing Summary',
          description: `${mlProcessingStats.completed_today} credit scores generated today with avg processing time of ${mlProcessingStats.avg_processing_time}s`,
          time: 'Today',
          type: 'ml_processing',
          actionable: true,
          onAction: () => handleDismissSystemAlert('ml-daily-summary')
        });
      }

      // ML Processing failures (dismissible for low counts, always visible for high counts)
      if (mlProcessingStats.failed_today > 0) {
        const severity = mlProcessingStats.failed_today > 3 ? 'high' : 'medium';
        const isDismissible = mlProcessingStats.failed_today <= 2; // Only dismiss if 1-2 failures
        const alertId = 'ml-failures';
        
        if (!isDismissible || !dismissedSystemAlerts.has(alertId)) {
          alerts.push({
            id: alertId,
            severity,
            title: 'ML Processing Issues',
            description: `${mlProcessingStats.failed_today} ML processing ${mlProcessingStats.failed_today === 1 ? 'failure' : 'failures'} detected today. Review system logs.`,
            time: 'Today',
            type: 'ml_processing',
            actionable: isDismissible,
            onAction: isDismissible ? () => handleDismissSystemAlert(alertId) : undefined
          });
        }
      }

      // ML Model performance alert (dismissible)
      if (mlProcessingStats.avg_processing_time > 60 && !dismissedSystemAlerts.has('ml-performance')) {
        alerts.push({
          id: 'ml-performance',
          severity: 'medium',
          title: 'ML Model Performance Alert',
          description: `Average processing time is ${mlProcessingStats.avg_processing_time}s. Consider model optimization.`,
          time: 'Performance monitoring',
          type: 'ml_processing',
          actionable: true,
          onAction: () => handleDismissSystemAlert('ml-performance')
        });
      }
    }

    // Add security alerts from audit logs
    if (auditLogs && userType === 'admin') {
      const recentLogins = auditLogs.filter(log => log.action === 'LOGIN');
      const failedAttempts = auditLogs.filter(log => 
        log.action === 'LOGIN' && log.metadata?.success === false
      );

      if (failedAttempts.length > 5) {
        alerts.push({
          id: 'failed-logins',
          severity: 'high',
          title: 'Multiple Failed Login Attempts',
          description: `${failedAttempts.length} failed login attempts detected. Review security logs.`,
          time: 'Security monitoring',
          type: 'security'
        });
      }

      // Add recent successful logins for transparency
      if (recentLogins.length > 0) {
        const latestLogin = recentLogins[0];
        alerts.push({
          id: 'latest-login',
          severity: 'info',
          title: 'Recent Admin Activity',
          description: `Latest admin login from ${latestLogin.ip_address}`,
          time: formatTime(latestLogin.timestamp),
          type: 'security'
        });
      }
    }

    // Add client-specific alerts
    if (userType === 'client') {
      // Show welcome message only if it hasn't been dismissed and there are no notifications
      if (!isWelcomeMessageDismissed && (!currentNotifications || currentNotifications.length === 0)) {
        alerts.push({
          id: 'welcome-client',
          severity: 'info',
          title: 'Welcome to Your Dashboard',
          description: 'Your account is active. You will receive notifications about application updates here.',
          time: 'Welcome message',
          type: 'notification',
          actionable: true,
          onAction: handleDismissWelcomeMessage
        });
      }
    }

    // Sort by severity and time
    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [currentNotifications, rbacData, auditLogs, userType, isWelcomeMessageDismissed, dismissedSystemAlerts, handleMarkNotificationRead, handleDismissWelcomeMessage, handleDismissSystemAlert]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    switch (filterType) {
      case 'unread':
        return systemAlerts.filter(alert => alert.actionable);
      case 'high':
        return systemAlerts.filter(alert => alert.severity === 'high');
      case 'security':
        return systemAlerts.filter(alert => alert.type === 'security');
      case 'ml_processing':
        return systemAlerts.filter(alert => alert.type === 'ml_processing');
      default:
        return systemAlerts;
    }
  }, [systemAlerts, filterType]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const isLoadingData = isLoading || notificationsLoading || auditLoading;

  if (isLoadingData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {userType === 'client' ? "Your Notifications" : "System Alerts"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
            {unreadCount && unreadCount.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                {unreadCount.count} unread
              </span>
            )}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-2">
          {((userType === 'admin' || userType === 'staff') 
            ? ['all', 'unread', 'high', 'security', 'ml_processing']
            : ['all', 'unread', 'high']
          ).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === filter
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filter === 'ml_processing' ? 'ML Processing' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Clear!</h3>
            <p className="text-sm">
              {filterType === 'all' 
                ? "No alerts at this time. Your system is running smoothly."
                : `No ${filterType} alerts found.`
              }
            </p>
          </div>
        ) : (
          <>
            {filteredAlerts.slice(0, 5).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <AlertCard
                  severity={alert.severity}
                  title={alert.title}
                  description={alert.description}
                  time={alert.time}
                />
                {alert.actionable && (
                  <button
                    onClick={alert.onAction}
                    className="absolute top-4 right-4 text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    {alert.id === 'welcome-client' || alert.id?.startsWith('system-') || alert.id?.startsWith('ml-') || alert.id?.includes('activity') ? 'Dismiss' : 'Mark Read'}
                  </button>
                )}
              </motion.div>
            ))}

            {/* Show more button */}
            {filteredAlerts.length > 5 && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  View {filteredAlerts.length - 5} more alerts
                </button>
              </div>
            )}

            {/* Quick actions */}
            {((unreadCount && unreadCount.count > 0) || (currentNotifications && currentNotifications.length > 0)) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {unreadCount && unreadCount.count > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Mark All as Read ({unreadCount.count})
                  </button>
                )}
                
                {/* Bulk delete actions for notifications */}
                {currentNotifications && currentNotifications.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleClearReadNotifications}
                      disabled={!currentNotifications.some(n => n.is_read)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Read
                    </button>
                    <button
                      onClick={handleDeleteAllNotifications}
                      className="flex-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    >
                      Delete All
                    </button>
                  </div>
                )}

                {/* Reset dismissed alerts for admin/staff */}
                {(userType === 'admin' || userType === 'staff') && dismissedSystemAlerts.size > 0 && (
                  <button
                    onClick={handleResetDismissedAlerts}
                    className="w-full px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  >
                    Show Dismissed System Alerts ({dismissedSystemAlerts.size})
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};