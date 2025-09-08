import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiDownload,
  FiShare2,
  FiTrash2,
  FiEye,
  FiClock,
  FiUser,
  FiMoreVertical,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiX,
  FiBarChart3,
  FiTrendingUp,
  FiShield,
  FiTarget,
  FiPieChart,
  FiActivity,
  FiZap,
  FiDatabase,
  FiLayers,
} from "react-icons/fi";
import type { Report } from "../../../components/redux/features/api/reports/reportsApi";

interface ReportCardProps {
  report: Report;
  onView: () => void;
  onExport?: (reportId: string, format: string) => void;
  onShare: (reportId: string, userIds: number[]) => void;
  onDelete?: (reportId: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onView,
  onExport,
  onShare,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getStatusIcon = () => {
    switch (report.status) {
      case "COMPLETED":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case "GENERATING":
        return <FiLoader className="h-4 w-4 text-blue-500 animate-spin" />;
      case "FAILED":
        return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      case "EXPIRED":
        return <FiX className="h-4 w-4 text-gray-500" />;
      default:
        return <FiClock className="h-4 w-4 text-yellow-500" />;
    }
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

  const getReportTypeIcon = () => {
    switch (report.report_type) {
      case "RISK_SUMMARY":
        return <FiShield className="h-5 w-5 text-white" />;
      case "APPLICATION_ANALYTICS":
        return <FiBarChart3 className="h-5 w-5 text-white" />;
      case "PERFORMANCE_METRICS":
        return <FiActivity className="h-5 w-5 text-white" />;
      case "COMPLIANCE_AUDIT":
        return <FiShield className="h-5 w-5 text-white" />;
      case "CREDIT_SCORE_ANALYSIS":
        return <FiTrendingUp className="h-5 w-5 text-white" />;
      case "DEFAULT_PREDICTION":
        return <FiTarget className="h-5 w-5 text-white" />;
      case "PORTFOLIO_RISK":
        return <FiPieChart className="h-5 w-5 text-white" />;
      case "UNDERWRITING_PERFORMANCE":
        return <FiZap className="h-5 w-5 text-white" />;
      case "REGULATORY_COMPLIANCE":
        return <FiShield className="h-5 w-5 text-white" />;
      case "LOSS_MITIGATION":
        return <FiDatabase className="h-5 w-5 text-white" />;
      case "CONCENTRATION_RISK":
        return <FiLayers className="h-5 w-5 text-white" />;
      case "MODEL_VALIDATION":
        return <FiActivity className="h-5 w-5 text-white" />;
      case "STRESS_TEST":
        return <FiZap className="h-5 w-5 text-white" />;
      default:
        return <FiFileText className="h-5 w-5 text-white" />;
    }
  };

  const getReportTypeDisplay = () => {
    const typeMap: { [key: string]: string } = {
      'RISK_SUMMARY': 'Risk Assessment Summary',
      'APPLICATION_ANALYTICS': 'Application Analytics',
      'PERFORMANCE_METRICS': 'Performance Metrics',
      'COMPLIANCE_AUDIT': 'Compliance Audit',
      'FINANCIAL_OVERVIEW': 'Financial Overview',
      'MONTHLY_SUMMARY': 'Monthly Summary',
      'QUARTERLY_REPORT': 'Quarterly Report',
      'CREDIT_SCORE_ANALYSIS': 'Credit Score Analysis',
      'DEFAULT_PREDICTION': 'Default Prediction',
      'PORTFOLIO_RISK': 'Portfolio Risk Analysis',
      'UNDERWRITING_PERFORMANCE': 'Underwriting Performance',
      'REGULATORY_COMPLIANCE': 'Regulatory Compliance',
      'LOSS_MITIGATION': 'Loss Mitigation',
      'CONCENTRATION_RISK': 'Concentration Risk',
      'MODEL_VALIDATION': 'ML Model Validation',
      'STRESS_TEST': 'Stress Testing',
      'CUSTOM': 'Custom Report',
    };
    return typeMap[report.report_type] || report.report_type.replace(/_/g, " ");
  };

  const getReportTypeColor = () => {
    switch (report.report_type) {
      case "RISK_SUMMARY":
      case "DEFAULT_PREDICTION":
      case "PORTFOLIO_RISK":
        return "from-red-500 to-orange-600";
      case "CREDIT_SCORE_ANALYSIS":
      case "UNDERWRITING_PERFORMANCE":
        return "from-blue-500 to-cyan-600";
      case "COMPLIANCE_AUDIT":
      case "REGULATORY_COMPLIANCE":
        return "from-green-500 to-emerald-600";
      case "MODEL_VALIDATION":
      case "STRESS_TEST":
        return "from-purple-500 to-violet-600";
      case "LOSS_MITIGATION":
      case "CONCENTRATION_RISK":
        return "from-amber-500 to-yellow-600";
      default:
        return "from-indigo-500 to-purple-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-900/10 dark:via-transparent dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gradient-to-r ${getReportTypeColor()} rounded-xl shadow-lg`}>
            {getReportTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1">
              {report.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getReportTypeDisplay()}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiMoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
              <button
                onClick={() => {
                  onView();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <FiEye className="h-4 w-4" />
                <span>View Details</span>
              </button>

              {onExport && report.status === "COMPLETED" && (
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span>Export</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute left-full top-0 ml-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      {["pdf", "excel", "csv"].map((format) => (
                        <button
                          key={format}
                          onClick={() => {
                            onExport(report.id, format);
                            setShowExportMenu(false);
                            setShowMenu(false);
                          }}
                          className="w-full px-3 py-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 uppercase"
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
                  // Handle share
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <FiShare2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              {onDelete && report.can_delete && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this report?")) {
                      onDelete(report.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <FiTrash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {report.description && (
        <p className="relative text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {report.description}
        </p>
      )}

      {/* Status */}
      <div className="relative flex items-center justify-between mb-4">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{report.status.replace("_", " ")}</span>
        </div>

        {report.is_expired && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            Expired
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="relative text-xs text-gray-500 dark:text-gray-400 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <FiUser className="h-3 w-3" />
            <span>{report.created_by.first_name} {report.created_by.last_name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock className="h-3 w-3" />
            <span>{formatDate(report.created_at)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiEye className="h-3 w-3" />
              <span>{report.views_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiDownload className="h-3 w-3" />
              <span>{report.downloads_count}</span>
            </div>
            {report.file_size && (
              <div className="flex items-center space-x-1">
                <FiDatabase className="h-3 w-3" />
                <span>{(report.file_size / 1024).toFixed(1)}KB</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {report.shared_with.length > 0 && (
              <div className="flex items-center space-x-1">
                <FiShare2 className="h-3 w-3" />
                <span>{report.shared_with.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click overlay for viewing */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onView}
      />
    </motion.div>
  );
};

export default ReportCard;