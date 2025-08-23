import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiClock, FiAlertCircle, FiEye, FiTrash2, FiArchive, FiMoreVertical, FiSettings, FiFilter } from 'react-icons/fi';
import { useNotifications } from '../utils/hooks/useNotifications';
import { 
  useGetRecentNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useArchiveNotificationMutation,
  useClearReadNotificationsMutation,
  useAutoCleanupNotificationsMutation,
  type Notification 
} from '../redux/features/api/notifications/notificationsApi';
import { NotificationConfirmModal } from './NotificationConfirmModal';
import { useToast } from '../utils/Toast';
import { useNotificationContext } from './NotificationProvider';

const NotificationBell: React.FC = () => {
  const { unreadCount, isConnected } = useNotifications();
  const { notifications, refreshNotifications } = useNotificationContext();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'archive' | 'clear' | 'deleteAll';
    title: string;
    description: string;
    onConfirm: () => void;
    itemCount?: number;
    destructive?: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    title: '',
    description: '',
    onConfirm: () => {},
  });
  
  // Fetch actual notifications from API - using context now
  const { data: apiNotifications, isLoading: notificationsLoading, refetch } = useGetRecentNotificationsQuery();
  const currentNotifications = notifications || apiNotifications || [];
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();
  const [archiveNotification] = useArchiveNotificationMutation();
  const [clearReadNotifications] = useClearReadNotificationsMutation();
  const [autoCleanupNotifications] = useAutoCleanupNotificationsMutation();

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.notification_type) {
      case 'ML_PROCESSING_STARTED':
        return <FiClock className="w-4 h-4 text-blue-500" />;
      case 'ML_PROCESSING_COMPLETED':
      case 'CREDIT_SCORE_GENERATED':
        return <FiCheck className="w-4 h-4 text-green-500" />;
      case 'ML_PROCESSING_FAILED':
      case 'SYSTEM_ALERT':
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      case 'APPLICATION_SUBMITTED':
      case 'DOCUMENT_UPLOADED':
        return <FiBell className="w-4 h-4 text-blue-500" />;
      case 'STATUS_CHANGE':
      case 'DECISION_MADE':
        return <FiEye className="w-4 h-4 text-yellow-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNotificationTypeLabel = (notification: Notification) => {
    return notification.notification_type_display || notification.notification_type;
  };

  // Filter notifications based on selected filter
  const filteredNotifications = React.useMemo(() => {
    if (!currentNotifications) return [];
    
    switch (filterType) {
      case 'unread':
        return currentNotifications.filter(n => !n.is_read);
      case 'read':
        return currentNotifications.filter(n => n.is_read);
      default:
        return currentNotifications;
    }
  }, [currentNotifications, filterType]);

  // Refresh notifications when dropdown opens
  const handleDropdownToggle = () => {
    if (!isOpen) {
      refetch(); // Refresh notifications when opening
      refreshNotifications(); // Also refresh context
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead().unwrap();
      refetch(); // Refresh notifications list
      refreshNotifications(); // Also refresh context
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationRead(id).unwrap();
      refetch(); // Refresh notifications list
      refreshNotifications(); // Also refresh context
      showToast('Notification marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDeleteNotification = (id: number) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: 'Delete Notification',
      description: 'Are you sure you want to delete this notification? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteNotification(id).unwrap();
          refetch();
          refreshNotifications();
          showToast('Notification deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete notification:', error);
          showToast('Failed to delete notification', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      destructive: true
    });
  };

  const handleArchiveNotification = (id: number) => {
    setConfirmModal({
      isOpen: true,
      type: 'archive',
      title: 'Archive Notification',
      description: 'This notification will be archived and moved out of your active list.',
      onConfirm: async () => {
        try {
          await archiveNotification(id).unwrap();
          refetch();
          refreshNotifications();
          showToast('Notification archived successfully', 'success');
        } catch (error) {
          console.error('Failed to archive notification:', error);
          showToast('Failed to archive notification', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleClearReadNotifications = () => {
    const readCount = notifications?.filter(n => n.is_read).length || 0;
    
    setConfirmModal({
      isOpen: true,
      type: 'clear',
      title: 'Clear Read Notifications',
      description: 'This will permanently delete all notifications you have already read.',
      itemCount: readCount,
      onConfirm: async () => {
        try {
          await clearReadNotifications().unwrap();
          refetch();
          refreshNotifications();
          showToast(`${readCount} read notifications cleared`, 'success');
        } catch (error) {
          console.error('Failed to clear read notifications:', error);
          showToast('Failed to clear notifications', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      destructive: true
    });
  };

  const handleDeleteAllNotifications = () => {
    const totalCount = notifications?.length || 0;
    
    setConfirmModal({
      isOpen: true,
      type: 'deleteAll',
      title: 'Delete All Notifications',
      description: 'This will permanently delete all your notifications, including unread ones. This action cannot be undone.',
      itemCount: totalCount,
      onConfirm: async () => {
        try {
          await deleteAllNotifications({}).unwrap();
          refetch();
          refreshNotifications();
          showToast(`All ${totalCount} notifications deleted`, 'success');
        } catch (error) {
          console.error('Failed to delete all notifications:', error);
          showToast('Failed to delete all notifications', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      destructive: true
    });
  };

  const handleAutoCleanup = () => {
    setConfirmModal({
      isOpen: true,
      type: 'clear',
      title: 'Auto-Cleanup Old Notifications',
      description: 'This will permanently delete all read notifications older than 30 days. This helps keep your notification list manageable.',
      onConfirm: async () => {
        try {
          const result = await autoCleanupNotifications({ days_old: 30 }).unwrap();
          refetch();
          refreshNotifications();
          showToast(`${result.deleted} old notifications cleaned up`, 'success');
        } catch (error) {
          console.error('Failed to auto-cleanup notifications:', error);
          showToast('Failed to cleanup old notifications', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      destructive: true
    });
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDropdownToggle}
        className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 shadow-sm"
      >
        <FiBell className="h-5 w-5" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
        
        {/* Connection Status Indicator - Only show when disconnected */}
        {!isConnected && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-gray-800 animate-pulse" />
        )}
      </motion.button>

      {/* Simple Dropdown for now */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl z-[9000] overflow-hidden"
          >
            {/* Enhanced Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`} title={isConnected ? 'Connected' : 'Connecting...'} />
                  {filteredNotifications.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                      {filteredNotifications.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5">
                    {(['all', 'unread', 'read'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterType(filter)}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          filterType === filter
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {notificationsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="animate-pulse">
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications && filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                  Mark read
                                </button>
                              )}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNotificationMenu(
                                      activeNotificationMenu === notification.id ? null : notification.id
                                    );
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <FiMoreVertical className="w-4 h-4" />
                                </button>
                                
                                {activeNotificationMenu === notification.id && (
                                  <div className="absolute right-0 top-8 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-[9100]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveNotification(notification.id);
                                        setActiveNotificationMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                                    >
                                      <FiArchive className="w-3 h-3" />
                                      <span>Archive</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNotification(notification.id);
                                        setActiveNotificationMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notification.time_ago || formatTimeAgo(notification.created_at)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                              {getNotificationTypeLabel(notification)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filterType === 'all' ? 'No notifications yet' : `No ${filterType} notifications`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {filterType === 'all' 
                      ? (isConnected ? 'Updates will appear here' : 'Connecting...') 
                      : `Try changing the filter above`
                    }
                  </p>
                </div>
              )}
              
              {/* Footer actions */}
              {currentNotifications && currentNotifications.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-2">
                    {/* Quick actions row */}
                    <div className="flex items-center justify-between text-sm">
                      {currentNotifications.length > 5 && (
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          View all ({currentNotifications.length})
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 ml-auto"
                        >
                          Mark all read ({unreadCount})
                        </button>
                      )}
                    </div>
                    
                    {/* Bulk action buttons */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        onClick={handleClearReadNotifications}
                        disabled={!currentNotifications.some(n => n.is_read)}
                        className="px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                      >
                        <FiTrash2 className="w-3 h-3" />
                        <span>Clear Read</span>
                      </button>
                      
                      <button
                        onClick={handleAutoCleanup}
                        className="px-2 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex items-center justify-center space-x-1"
                      >
                        <FiClock className="w-3 h-3" />
                        <span>Auto-Clean</span>
                      </button>
                      
                      <button
                        onClick={handleDeleteAllNotifications}
                        className="px-2 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center justify-center space-x-1"
                      >
                        <FiTrash2 className="w-3 h-3" />
                        <span>Delete All</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[8999]"
          onClick={() => {
            setIsOpen(false);
            setActiveNotificationMenu(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <NotificationConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        type={confirmModal.type}
        itemCount={confirmModal.itemCount}
        destructive={confirmModal.destructive}
      />
    </div>
  );
};

export default NotificationBell;