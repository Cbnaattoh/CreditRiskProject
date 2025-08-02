import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiRefreshCw, 
  FiFilter,
  FiPlus,
  FiX
} from 'react-icons/fi';
import { 
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearReadNotificationsMutation,
  useCreateNotificationMutation,
  type Notification,
  type NotificationCreateRequest
} from '../../components/redux/features/api/notifications';
import { useIsAdmin } from '../../components/utils/hooks/useRBAC';
import { ProtectedComponent } from '../../components/redux/features/api/RBAC/ProtectedComponent';
import { useToast } from '../../components/utils/Toast';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState<Partial<NotificationCreateRequest>>({
    notification_type: 'SYSTEM_ALERT',
    title: '',
    message: '',
  });

  const isAdmin = useIsAdmin();
  const { showToast } = useToast();
  const { data: notifications = [], refetch, isLoading } = useGetNotificationsQuery();
  const { data: unreadCount = { count: 0 }, refetch: refetchCount } = useGetUnreadCountQuery();
  
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [clearRead] = useClearReadNotificationsMutation();
  const [createNotification] = useCreateNotificationMutation();

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markRead(notificationId).unwrap();
      refetchCount();
      showToast('Marked as read', 'success', 2000);
    } catch (error) {
      showToast('Failed to mark as read', 'error', 3000);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllRead().unwrap();
      refetchCount();
      showToast(`Marked ${result.updated} notifications as read`, 'success', 3000);
    } catch (error) {
      showToast('Failed to mark all as read', 'error', 3000);
    }
  };

  const handleClearRead = async () => {
    try {
      const result = await clearRead().unwrap();
      showToast(`Deleted ${result.deleted} read notifications`, 'success', 3000);
    } catch (error) {
      showToast('Failed to clear read notifications', 'error', 3000);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotification.title || !newNotification.message) {
      showToast('Title and message are required', 'error', 3000);
      return;
    }

    try {
      await createNotification({
        recipient: 1, // This would need to be dynamic based on selected user
        notification_type: newNotification.notification_type || 'SYSTEM_ALERT',
        title: newNotification.title,
        message: newNotification.message,
      }).unwrap();
      
      setShowCreateForm(false);
      setNewNotification({ notification_type: 'SYSTEM_ALERT', title: '', message: '' });
      showToast('Notification created', 'success', 3000);
    } catch (error) {
      showToast('Failed to create notification', 'error', 3000);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED': return '📝';
      case 'STATUS_CHANGE': return '🔄';
      case 'DOCUMENT_UPLOADED': return '📄';
      case 'RISK_ASSESSED': return '⚠️';
      case 'DECISION_MADE': return '✅';
      case 'SYSTEM_ALERT': return '🚨';
      default: return '📬';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED': return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
      case 'STATUS_CHANGE': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'DOCUMENT_UPLOADED': return 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10';
      case 'RISK_ASSESSED': return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10';
      case 'DECISION_MADE': return 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10';
      case 'SYSTEM_ALERT': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      default: return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FiBell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount.count > 0 && (
              <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount.count} unread
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Create Notification Button (Admin Only) */}
            <ProtectedComponent roles={['Administrator', 'Manager']}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiPlus className="h-4 w-4" />
                <span>Create</span>
              </motion.button>
            </ProtectedComponent>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <FiCheck className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
              
              {notifications.some(n => n.is_read) && (
                <button
                  onClick={handleClearRead}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiTrash2 className="h-3 w-3" />
                  <span>Clear read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <FiBell className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 
                 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 ${getNotificationColor(notification.notification_type)} ${
                  !notification.is_read ? 'border border-blue-200 dark:border-blue-800' : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <span className="text-2xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        !notification.is_read 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                          {notification.notification_type_display}
                        </span>
                      </div>
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create Notification Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Notification
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newNotification.notification_type}
                    onChange={(e) => setNewNotification({ ...newNotification, notification_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="APPLICATION_SUBMITTED">Application Submitted</option>
                    <option value="STATUS_CHANGE">Status Change</option>
                    <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
                    <option value="RISK_ASSESSED">Risk Assessed</option>
                    <option value="DECISION_MADE">Decision Made</option>
                    <option value="SYSTEM_ALERT">System Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Notification message"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;