import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle,
  FiShield,
  FiUser,
  FiClock,
  FiMapPin,
  FiMonitor,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
} from 'react-icons/fi';
import {
  useGetSuspiciousActivitiesQuery,
  useGetCriticalAlertsQuery,
  useGetActivitySummaryQuery,
  useMarkActivityChallengedMutation,
} from '../../components/redux/features/api/security/securityApi';
import type { SuspiciousActivity } from '../../components/redux/features/api/security/securityApi';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityDetailModalProps {
  activity: SuspiciousActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onChallenge: (id: number) => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  onChallenge,
}) => {
  if (!isOpen || !activity) return null;

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Suspicious Activity Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Activity ID: {activity.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiXCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600 dark:text-gray-400">Email:</span> {activity.user_email}</p>
                <p><span className="text-gray-600 dark:text-gray-400">Name:</span> {activity.user_name}</p>
                <p><span className="text-gray-600 dark:text-gray-400">Type:</span> {activity.user.user_type}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Activity Info</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600 dark:text-gray-400">Type:</span> {activity.activity_type_display}</p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(activity.risk_level)}`}>
                    {activity.risk_level}
                  </span>
                </p>
                <p><span className="text-gray-600 dark:text-gray-400">Confidence:</span> {(activity.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Technical Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">IP Address</p>
                <p className="font-mono text-gray-900 dark:text-white">{activity.ip_address}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Detected At</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(activity.detected_at), 'PPpp')}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-600 dark:text-gray-400 mb-1">User Agent</p>
                <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                  {activity.user_agent}
                </p>
              </div>
            </div>
          </div>

          {/* Formatted Details */}
          {Object.keys(activity.formatted_details || {}).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Additional Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {Object.entries(activity.formatted_details).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-gray-600 dark:text-gray-400">{key}</p>
                    <p className="text-gray-900 dark:text-white">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {activity.was_challenged ? (
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FiXCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {activity.was_challenged ? 'Challenged' : 'Not Challenged'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activity.was_successful ? (
                  <FiCheckCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <FiXCircle className="w-5 h-5 text-green-500" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {activity.was_successful ? 'Successful' : 'Failed'}
                </span>
              </div>
            </div>

            {!activity.was_challenged && (
              <button
                onClick={() => onChallenge(activity.id)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Mark as Challenged
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ActivityCard: React.FC<{
  activity: SuspiciousActivity;
  onClick: (activity: SuspiciousActivity) => void;
}> = ({ activity, onClick }) => {
  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(activity)}
      className={`p-4 rounded-xl border-l-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${getSeverityColor(activity.risk_level)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {activity.activity_type_display}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activity.user_email}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskBadgeColor(activity.risk_level)}`}>
          {activity.risk_level}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <FiClock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            {formatDistanceToNow(new Date(activity.detected_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiMapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">
            {activity.ip_address}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {activity.was_challenged ? (
              <FiCheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <FiXCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500">
              {activity.was_challenged ? 'Challenged' : 'Not Challenged'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {activity.was_successful ? (
              <FiCheckCircle className="w-4 h-4 text-red-500" />
            ) : (
              <FiXCircle className="w-4 h-4 text-green-500" />
            )}
            <span className="text-xs text-gray-500">
              {activity.was_successful ? 'Successful' : 'Failed'}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Confidence: {(activity.confidence * 100).toFixed(1)}%
        </div>
      </div>
    </motion.div>
  );
};

const SuspiciousActivities: React.FC = () => {
  const [filters, setFilters] = useState({
    activity_type: '',
    risk_level: '',
    days: '30',
    search: '',
  });
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    data: activities = [],
    isLoading,
    error,
    refetch,
  } = useGetSuspiciousActivitiesQuery({
    activity_type: filters.activity_type || undefined,
    risk_level: filters.risk_level || undefined,
    days: parseInt(filters.days),
  });

  const {
    data: criticalAlerts = [],
    isLoading: criticalLoading,
  } = useGetCriticalAlertsQuery();

  const {
    data: activitySummary = [],
    isLoading: summaryLoading,
  } = useGetActivitySummaryQuery();

  const [markChallenged] = useMarkActivityChallengedMutation();

  const filteredActivities = useMemo(() => {
    if (!filters.search) return activities;
    return activities.filter(activity =>
      activity.user_email.toLowerCase().includes(filters.search.toLowerCase()) ||
      activity.user_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      activity.activity_type_display.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [activities, filters.search]);

  const handleActivityClick = (activity: SuspiciousActivity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleMarkChallenged = async (id: number) => {
    try {
      await markChallenged(id).unwrap();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Failed to mark activity as challenged:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load suspicious activities
          </h3>
          <button
            onClick={() => refetch()}
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
            <FiShield className="w-8 h-8 text-red-500" />
            Suspicious Activities
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and investigate suspicious user activities
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <FiShield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activities.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {criticalAlerts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <FiUser className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Challenged</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activities.filter(a => a.was_challenged).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed Attempts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activities.filter(a => !a.was_successful).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FiSearch className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filters.activity_type}
            onChange={(e) => setFilters(prev => ({ ...prev, activity_type: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Activity Types</option>
            <option value="LOGIN">Login Attempts</option>
            <option value="PASSWORD">Password Changes</option>
            <option value="APPLICATION">Application Changes</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={filters.risk_level}
            onChange={(e) => setFilters(prev => ({ ...prev, risk_level: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filters.days}
            onChange={(e) => setFilters(prev => ({ ...prev, days: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={handleActivityClick}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No suspicious activities found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or refresh the data
          </p>
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedActivity(null);
        }}
        onChallenge={handleMarkChallenged}
      />
    </div>
  );
};

export default SuspiciousActivities;