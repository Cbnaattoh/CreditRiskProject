import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../utils/hooks/useNotifications';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  application_id?: string;
  reference_number?: string;
  credit_score?: number;
  risk_level?: string;
  confidence?: number;
  status?: string;
  error_message?: string;
  is_read: boolean;
  timestamp: string;
}

const NotificationBell: React.FC = () => {
  const { unreadCount, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ML_PROCESSING_STARTED':
        return <FiClock className="w-4 h-4 text-blue-500" />;
      case 'ML_PROCESSING_COMPLETED':
      case 'CREDIT_SCORE_GENERATED':
        return <FiCheck className="w-4 h-4 text-green-500" />;
      case 'ML_PROCESSING_FAILED':
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
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

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'ML_PROCESSING_STARTED':
        return 'Processing Started';
      case 'ML_PROCESSING_COMPLETED':
        return 'Processing Complete';
      case 'ML_PROCESSING_FAILED':
        return 'Processing Failed';
      case 'CREDIT_SCORE_GENERATED':
        return 'Score Generated';
      default:
        return 'Notification';
    }
  };

  // Placeholder notifications for now - this would come from API
  useEffect(() => {
    // You can fetch real notifications here or connect to WebSocket
    // For now, we'll use the unreadCount from the existing hook
  }, []);

  const handleMarkAllRead = () => {
    // Implement mark all read logic
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkAsRead = (id: number) => {
    // Implement mark as read logic
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ));
  };

  const handleClearNotification = (id: number) => {
    // Implement clear notification logic
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
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
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`} />
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

            {/* Content */}
            <div className="p-8 text-center">
              <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No notifications yet'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {isConnected ? 'ML processing updates will appear here' : 'Connecting...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;