import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiDownload,
  FiShare2,
  FiTrash2,
  FiFileText,
  FiUser,
  FiClock,
  FiEye,
  FiCalendar,
  FiTag,
  FiSettings,
} from "react-icons/fi";
import type { Report } from "../../../components/redux/features/api/reports/reportsApi";

interface ReportModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onExport?: (reportId: string, format: string) => void;
  onShare: (reportId: string, userIds: number[]) => void;
  onDelete?: (reportId: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onExport,
  onShare,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "data" | "settings">("overview");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = () => {
    switch (report.status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "GENERATING":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
      case "FAILED":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      case "EXPIRED":
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/50";
      default:
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
    }
  };

  const getReportTypeDisplay = () => {
    return report.report_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="relative flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getReportTypeDisplay()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Actions */}
                {onExport && report.status === "COMPLETED" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Export"
                    >
                      <FiDownload className="h-5 w-5" />
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 top-12 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                        {["pdf", "excel", "csv"].map((format) => (
                          <button
                            key={format}
                            onClick={() => {
                              onExport(report.id, format);
                              setShowExportMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 uppercase"
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    // Handle share - you'd implement a share modal here
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Share"
                >
                  <FiShare2 className="h-5 w-5" />
                </button>

                {onDelete && report.can_delete && (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this report?")) {
                        onDelete(report.id);
                        onClose();
                      }
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Status and Metadata */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    <span>{report.status.replace("_", " ")}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <FiUser className="h-4 w-4" />
                    <span>{report.created_by.first_name} {report.created_by.last_name}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <FiClock className="h-4 w-4" />
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <FiEye className="h-4 w-4" />
                    <span>{report.views_count} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiDownload className="h-4 w-4" />
                    <span>{report.downloads_count} downloads</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 px-6 pt-4">
              {["overview", "data", "settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all duration-200
                    ${
                      activeTab === tab
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Description */}
                    {report.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Description
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {/* Date Range */}
                    {(report.date_from || report.date_to) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Date Range
                        </h3>
                        <div className="flex items-center space-x-4">
                          {report.date_from && (
                            <div className="flex items-center space-x-2">
                              <FiCalendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                From: {new Date(report.date_from).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {report.date_to && (
                            <div className="flex items-center space-x-2">
                              <FiCalendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                To: {new Date(report.date_to).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Shared With */}
                    {report.shared_with.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Shared With
                        </h3>
                        <div className="space-y-2">
                          {report.shared_with.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {user.first_name[0]}{user.last_name[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "data" && (
                  <motion.div
                    key="data"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Report Data
                    </h3>
                    {report.status === "COMPLETED" && report.data ? (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
                          {JSON.stringify(report.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {report.status === "COMPLETED" 
                          ? "No data available"
                          : `Report is ${report.status.toLowerCase()}`
                        }
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Report Settings
                    </h3>

                    {/* Filters */}
                    {Object.keys(report.filters).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Filters Applied
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                          <pre className="text-sm text-gray-600 dark:text-gray-400">
                            {JSON.stringify(report.filters, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Configuration */}
                    {Object.keys(report.config).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Configuration
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                          <pre className="text-sm text-gray-600 dark:text-gray-400">
                            {JSON.stringify(report.config, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Timestamps
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Created:</span>
                          <span className="text-gray-900 dark:text-white">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        {report.generated_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Generated:</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatDate(report.generated_at)}
                            </span>
                          </div>
                        )}
                        {report.expires_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                            <span className={`${report.is_expired ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                              {formatDate(report.expires_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ReportModal;