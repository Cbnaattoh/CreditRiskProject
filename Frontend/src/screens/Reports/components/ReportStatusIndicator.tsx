import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiX,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import type { Report } from "../../../components/redux/features/api/reports/reportsApi";

interface ReportStatusIndicatorProps {
  report: Report;
  onRefresh?: () => void;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

const ReportStatusIndicator: React.FC<ReportStatusIndicatorProps> = ({
  report,
  onRefresh,
  showProgress = false,
  size = "md",
}) => {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Simulate progress for generating reports
  useEffect(() => {
    if (report.status === "GENERATING") {
      const startTime = new Date(report.created_at).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Simulate progress based on elapsed time
        // Assume reports take 30-300 seconds to generate
        const estimatedDuration = 120; // 2 minutes average
        const progressPercent = Math.min((elapsed / estimatedDuration) * 100, 95);
        setProgress(progressPercent);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [report.status, report.created_at]);

  const getStatusConfig = () => {
    switch (report.status) {
      case "COMPLETED":
        return {
          icon: FiCheckCircle,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          label: "Completed",
          description: "Report generated successfully",
        };
      case "GENERATING":
        return {
          icon: FiLoader,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          label: "Generating",
          description: `Processing... ${elapsedTime}s elapsed`,
        };
      case "FAILED":
        return {
          icon: FiAlertTriangle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          label: "Failed",
          description: "Generation failed - check logs",
        };
      case "EXPIRED":
        return {
          icon: FiX,
          color: "text-gray-500 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          label: "Expired",
          description: "Report has expired",
        };
      default: // PENDING
        return {
          icon: FiClock,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          label: "Pending",
          description: "Waiting to start",
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "px-2 py-1",
          icon: "h-3 w-3",
          text: "text-xs",
        };
      case "lg":
        return {
          container: "px-4 py-3",
          icon: "h-6 w-6",
          text: "text-base",
        };
      default: // md
        return {
          container: "px-3 py-2",
          icon: "h-4 w-4",
          text: "text-sm",
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const IconComponent = config.icon;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center space-x-2 rounded-full border ${config.bgColor} ${config.borderColor} ${sizeClasses.container}`}
      >
        <motion.div
          animate={report.status === "GENERATING" ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <IconComponent className={`${config.color} ${sizeClasses.icon}`} />
        </motion.div>
        <span className={`font-medium ${config.color} ${sizeClasses.text}`}>
          {config.label}
        </span>
        
        {onRefresh && report.status === "GENERATING" && (
          <button
            onClick={onRefresh}
            className={`${config.color} hover:opacity-70 transition-opacity`}
          >
            <FiRefreshCw className="h-3 w-3" />
          </button>
        )}
      </motion.div>

      {/* Progress Bar for Generating Reports */}
      {showProgress && report.status === "GENERATING" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-1"
        >
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Elapsed: {formatTime(elapsedTime)}
          </div>
        </motion.div>
      )}

      {/* Description */}
      {size === "lg" && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {config.description}
        </p>
      )}

      {/* Error Details for Failed Reports */}
      {report.status === "FAILED" && report.data?.error && size === "lg" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Error Details:
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
            {report.data.error}
          </p>
        </motion.div>
      )}

      {/* Generation Stats for Completed Reports */}
      {report.status === "COMPLETED" && report.generated_at && size === "lg" && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Generated: {new Date(report.generated_at).toLocaleString()}</div>
          {report.file_size && (
            <div>Size: {(report.file_size / 1024).toFixed(1)}KB</div>
          )}
          <div>Views: {report.views_count} | Downloads: {report.downloads_count}</div>
        </div>
      )}
    </div>
  );
};

export default ReportStatusIndicator;