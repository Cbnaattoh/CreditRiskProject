import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { 
  useGetUnreadCountQuery, 
  useGetRecentNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearReadNotificationsMutation
} from '../../redux/features/api/notifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: unreadCount = { count: 0 }, refetch: refetchCount } = useGetUnreadCountQuery();
  const { 
    data: notifications = [], 
    refetch: refetchNotifications,
    isLoading,
    isFetching
  } = useGetRecentNotificationsQuery();

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [clearRead] = useClearReadNotificationsMutation();

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      refetchNotifications();
      refetchCount();
    }
  };

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markRead(notificationId).unwrap();
      refetchCount();
      refetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      refetchCount();
      refetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleClearRead = async () => {
    try {
      await clearRead().unwrap();
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return '📝';
      case 'STATUS_CHANGE':
        return '🔄';
      case 'DOCUMENT_UPLOADED':
        return '📄';
      case 'RISK_ASSESSED':
        return '⚠️';
      case 'DECISION_MADE':
        return '✅';
      case 'SYSTEM_ALERT':
        return '🚨';
      default:
        return '📬';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return 'border-l-blue-500';
      case 'STATUS_CHANGE':
        return 'border-l-yellow-500';
      case 'DOCUMENT_UPLOADED':
        return 'border-l-green-500';
      case 'RISK_ASSESSED':
        return 'border-l-orange-500';
      case 'DECISION_MADE':
        return 'border-l-purple-500';
      case 'SYSTEM_ALERT':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleNotifications}
        className={`relative p-3 rounded-full transition-all duration-200 ${
          isOpen 
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <FiBell className="h-5 w-5" />
        
        {/* Unread count badge */}
        {unreadCount.count > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-14 z-50 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount.count > 0 && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                      {unreadCount.count} new
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  {(isLoading || isFetching) && (
                    <FiRefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center space-x-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    <FiCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                  
                  <button
                    onClick={handleClearRead}
                    className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <FiTrash2 className="h-3 w-3" />
                    <span>Clear read</span>
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <FiBell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-l-4 ${getNotificationColor(notification.notification_type)} ${
                          !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.notification_type)}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notification.is_read 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {notification.notification_type_display}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/home/notifications');
                    }}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;