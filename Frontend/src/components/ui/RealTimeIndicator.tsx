import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheck, FiClock } from 'react-icons/fi';
import { useRealTimeStatus } from '../../hooks/useRealTimeSettings';

interface RealTimeIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  showDetails?: boolean;
  onRefresh?: () => void;
}

export const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  position = 'top-right',
  showDetails = false,
  onRefresh
}) => {
  const { status, syncCount, lastUpdate, isConnected, refreshAll } = useRealTimeStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'syncing':
        return 'text-blue-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/10 border-green-500/20';
      case 'syncing':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'disconnected':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <FiWifi className="h-4 w-4" />;
      case 'syncing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiRefreshCw className="h-4 w-4" />
          </motion.div>
        );
      case 'disconnected':
        return <FiWifiOff className="h-4 w-4" />;
      default:
        return <FiClock className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Real-time sync active';
      case 'syncing':
        return 'Syncing data...';
      case 'disconnected':
        return 'Connection lost';
      default:
        return 'Initializing...';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      refreshAll();
    }
  };

  if (position === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <motion.div
          className={`flex items-center space-x-2 px-3 py-1.5 ${getStatusBg()} backdrop-blur-xl rounded-full border transition-all duration-300`}
          whileHover={{ scale: 1.05 }}
        >
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          {showDetails && (
            <div className="flex items-center space-x-2 text-sm">
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                • {formatLastUpdate()}
              </span>
            </div>
          )}
        </motion.div>
        
        <motion.button
          onClick={handleRefresh}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" />
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className={positionClasses[position]}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`relative overflow-hidden ${getStatusBg()} backdrop-blur-2xl rounded-2xl border shadow-lg transition-all duration-300`}
        whileHover={{ scale: 1.05 }}
        layout
      >
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <motion.div
              className={`p-2 rounded-xl ${getStatusBg()}`}
              animate={status === 'syncing' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: status === 'syncing' ? Infinity : 0 }}
            >
              <div className={getStatusColor()}>
                {getStatusIcon()}
              </div>
            </motion.div>
            
            <div className="flex-1">
              <div className={`font-semibold text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {showDetails && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <div>Updates: {syncCount}</div>
                  <div>Last: {formatLastUpdate()}</div>
                </div>
              )}
            </div>

            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-xl hover:bg-white/10"
            >
              <FiRefreshCw className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Animated border for syncing state */}
        <AnimatePresence>
          {status === 'syncing' && (
            <motion.div
              className="absolute inset-0 border-2 border-blue-500/50 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* Success pulse for connected state */}
        <AnimatePresence>
          {status === 'connected' && (
            <motion.div
              className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Compact version for headers/toolbars
export const CompactRealTimeIndicator: React.FC = () => {
  const { status, isConnected } = useRealTimeStatus();
  
  return (
    <motion.div
      className="flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${
          status === 'connected' ? 'bg-green-500' : 
          status === 'syncing' ? 'bg-blue-500' : 'bg-red-500'
        }`}
        animate={
          status === 'syncing' 
            ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } 
            : status === 'connected'
            ? { scale: [1, 1.2, 1] }
            : {}
        }
        transition={{ 
          duration: status === 'syncing' ? 1 : 2, 
          repeat: Infinity 
        }}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {status === 'connected' ? 'Live' : status === 'syncing' ? 'Sync' : 'Offline'}
      </span>
    </motion.div>
  );
};