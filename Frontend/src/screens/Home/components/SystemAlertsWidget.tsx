import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AlertCard from './AlertCard';
import { 
  useGetRecentNotificationsQuery, 
  useGetUnreadCountQuery,
  useGetRecentAuditLogsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation 
} from '../../../components/redux/features/api/notifications/notificationsApi';
import { useGetRBACDashboardQuery } from '../../../components/redux/features/api/RBAC/rbacApi';

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
  type: 'notification' | 'system' | 'security';
  actionable?: boolean;
  onAction?: () => void;
}

export const SystemAlertsWidget: React.FC<SystemAlertsWidgetProps> = ({
  userType,
  isLoading = false
}) => {
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'high' | 'security'>('all');
  
  // API queries
  const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = useGetRecentNotificationsQuery();
  const { data: unreadCount } = useGetUnreadCountQuery();
  const { data: auditLogs, isLoading: auditLoading } = useGetRecentAuditLogsQuery();
  const { data: rbacData } = useGetRBACDashboardQuery(undefined, {
    skip: userType !== 'admin'
  });

  // Mutations
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  // Transform backend data to alerts
  const systemAlerts = useMemo(() => {
    const alerts: SystemAlert[] = [];

    // Add notification-based alerts
    if (notifications) {
      notifications.forEach(notification => {
        let severity: SystemAlert['severity'] = 'info';
        
        // Map notification types to severity
        switch (notification.notification_type) {
          case 'SYSTEM_ALERT':
            severity = 'high';
            break;
          case 'STATUS_CHANGE':
          case 'DECISION_MADE':
            severity = 'medium';
            break;
          case 'APPLICATION_SUBMITTED':
          case 'DOCUMENT_UPLOADED':
            severity = 'low';
            break;
          default:
            severity = 'info';
        }

        alerts.push({
          id: `notification-${notification.id}`,
          severity,
          title: notification.title,
          description: notification.message,
          time: notification.time_ago || formatTime(notification.created_at),
          type: 'notification',
          actionable: !notification.is_read,
          onAction: () => markNotificationRead(notification.id)
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

      // Alert for high activity
      if (rbacData.recent_activity.assignments_24h > 10) {
        alerts.push({
          id: 'high-activity',
          severity: 'info',
          title: 'High Role Assignment Activity',
          description: `${rbacData.recent_activity.assignments_24h} new role assignments in the last 24 hours`,
          time: 'Last 24 hours',
          type: 'system'
        });
      }

      // Alert for permission check activity
      if (rbacData.recent_activity.permission_checks_24h > 100) {
        alerts.push({
          id: 'high-permission-activity',
          severity: 'info',
          title: 'High System Activity',
          description: `${rbacData.recent_activity.permission_checks_24h} permission checks performed in the last 24 hours`,
          time: 'Last 24 hours',
          type: 'system'
        });
      }

      // Alert for new users
      if (rbacData.summary.total_users > 0) {
        // This would need to be enhanced with actual new user data
        // For demo purposes, showing system health
        alerts.push({
          id: 'system-health',
          severity: 'info',
          title: 'System Status Update',
          description: `Managing ${rbacData.summary.total_users} users with ${rbacData.summary.active_assignments} active role assignments`,
          time: 'System overview',
          type: 'system'
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
      // Fallback alerts for clients when no notifications
      if (!notifications || notifications.length === 0) {
        alerts.push({
          id: 'welcome-client',
          severity: 'info',
          title: 'Welcome to Your Dashboard',
          description: 'Your account is active. You will receive notifications about application updates here.',
          time: 'Welcome message',
          type: 'notification'
        });
      }
    }

    // Sort by severity and time
    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [notifications, rbacData, auditLogs, userType, markNotificationRead]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    switch (filterType) {
      case 'unread':
        return systemAlerts.filter(alert => alert.actionable);
      case 'high':
        return systemAlerts.filter(alert => alert.severity === 'high');
      case 'security':
        return systemAlerts.filter(alert => alert.type === 'security');
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
          {['all', 'unread', 'high', 'security'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === filter
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
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
                    Mark Read
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
            {unreadCount && unreadCount.count > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => markAllRead()}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Mark All as Read ({unreadCount.count})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};