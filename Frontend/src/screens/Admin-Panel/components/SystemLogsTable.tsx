import React from "react";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiUser,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  performedBy: string;
  ipAddress: string;
  status: "Success" | "Failed" | "Warning";
  details: string;
}

interface SystemLogsTableProps {
  logs: LogEntry[];
}

const SystemLogsTable: React.FC<SystemLogsTableProps> = ({ logs }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case "Failed":
        return <FiXCircle className="h-4 w-4 text-red-500" />;
      case "Warning":
        return <FiAlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FiActivity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <FiActivity className="mx-auto text-6xl text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No system logs
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          System activity logs will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Activity Logs
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Recent system events and user activities
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {logs.length} entries
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(log.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.event}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {log.details}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <FiUser className="h-3 w-3" />
                      <span>{log.performedBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiShield className="h-3 w-3" />
                      <span>{log.ipAddress}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiClock className="h-3 w-3" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SystemLogsTable;