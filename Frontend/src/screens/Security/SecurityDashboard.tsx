import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiShield,
  FiAlertTriangle,
  FiUsers,
  FiActivity,
  FiEye,
  FiTrendingUp,
  FiClock,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  useGetSecurityDashboardStatsQuery,
  useGetSecurityAlertsQuery,
  useGetCriticalAlertsQuery,
} from '../../components/redux/features/api/security/securityApi';
import { formatDistanceToNow } from 'date-fns';

// Components
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, trend, color, subtitle }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 ${color}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-full bg-gradient-to-r ${color.replace('border-l-', 'from-').replace('-500', '-100')} to-transparent`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center">
        <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
        <span className="text-sm text-green-600">{trend}</span>
      </div>
    )}
  </motion.div>
);

const AlertItem: React.FC<{
  alert: {
    alert_type: string;
    severity: string;
    message: string;
    user_email: string;
    timestamp: string;
    details: Record<string, any>;
  };
}> = ({ alert }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
              {alert.severity}
            </span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {alert.message}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            User: {alert.user_email}
          </p>
        </div>
        <FiAlertTriangle className={`w-5 h-5 ${
          alert.severity === 'CRITICAL' ? 'text-red-500' : 
          alert.severity === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'
        }`} />
      </div>
    </motion.div>
  );
};

const ThreatTypeChart: React.FC<{
  data: Array<{ activity_type: string; count: number }>;
}> = ({ data }) => {
  const maxCount = Math.max(...data.map(item => item.count));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.activity_type} className="flex items-center gap-3">
          <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
            {item.activity_type}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / maxCount) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            />
          </div>
          <div className="w-8 text-sm font-bold text-gray-900 dark:text-white">
            {item.count}
          </div>
        </div>
      ))}
    </div>
  );
};

const SecurityDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetSecurityDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: alerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useGetSecurityAlertsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 15000, // Refresh every 15 seconds
  });

  const {
    data: criticalAlerts,
    isLoading: criticalLoading,
  } = useGetCriticalAlertsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 10000, // Refresh every 10 seconds
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchStats();
    refetchAlerts();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load security data
          </h3>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiShield className="w-8 h-8 text-blue-500" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Users Monitored"
          value={stats?.total_users_monitored || 0}
          icon={<FiUsers className="w-6 h-6 text-blue-500" />}
          color="border-l-blue-500"
          subtitle="Active users"
        />
        <StatCard
          title="High Risk Users"
          value={stats?.high_risk_users || 0}
          icon={<FiAlertTriangle className="w-6 h-6 text-red-500" />}
          color="border-l-red-500"
          subtitle="Require attention"
        />
        <StatCard
          title="Today's Activities"
          value={stats?.suspicious_activities_today || 0}
          icon={<FiActivity className="w-6 h-6 text-orange-500" />}
          color="border-l-orange-500"
          subtitle="Suspicious events"
        />
        <StatCard
          title="Critical Alerts"
          value={stats?.critical_alerts || 0}
          icon={<FiEye className="w-6 h-6 text-purple-500" />}
          color="border-l-purple-500"
          subtitle="Immediate action needed"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Behavioral Profiles"
          value={stats?.behavioral_profiles_count || 0}
          icon={<FiActivity className="w-6 h-6 text-green-500" />}
          color="border-l-green-500"
          subtitle="Active monitoring"
        />
        <StatCard
          title="Average Confidence"
          value={stats?.avg_confidence_score ? `${(stats.avg_confidence_score * 100).toFixed(1)}%` : '0%'}
          icon={<FiTrendingUp className="w-6 h-6 text-indigo-500" />}
          color="border-l-indigo-500"
          subtitle="System confidence"
        />
      </div>

      {/* Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Threat Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Threat Types (Last 7 Days)
          </h3>
          {stats?.top_threat_types && stats.top_threat_types.length > 0 ? (
            <ThreatTypeChart data={stats.top_threat_types} />
          ) : (
            <div className="text-center text-gray-500 py-8">
              No threat data available
            </div>
          )}
        </motion.div>

        {/* Recent Security Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Security Alerts
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alertsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert, index) => (
                <AlertItem key={index} alert={alert} />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiShield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                No recent alerts
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activities */}
      {stats?.recent_activities && stats.recent_activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Suspicious Activities
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Activity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Risk Level</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activities.slice(0, 8).map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {activity.user_email}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {activity.activity_type_display}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        activity.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        activity.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.detected_at), { addSuffix: true })}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {activity.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityDashboard;