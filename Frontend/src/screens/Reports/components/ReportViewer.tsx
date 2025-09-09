import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiDownload,
  FiShare2,
  FiCalendar,
  FiUser,
  FiClock,
  FiBarChart,
  FiPieChart,
  FiTrendingUp,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { Report } from "../../../components/redux/features/api/reports/reportsApi";

interface ReportViewerProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onExport?: (format: string) => void;
  onShare?: (userIds: number[]) => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  isOpen,
  onClose,
  onExport,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "data" | "visualizations">("overview");

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    switch (report.status) {
      case "COMPLETED":
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case "GENERATING":
        return <FiClock className="h-5 w-5 text-blue-500" />;
      case "FAILED":
        return <FiAlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FiInfo className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderDataVisualizations = () => {
    if (!report.data) return null;

    const data = report.data;

    // Credit Risk specific visualizations
    if (report.report_type === "CREDIT_SCORE_ANALYSIS" && data.score_distribution) {
      const chartData = Object.entries(data.score_distribution).map(([range, count]) => ({
        range,
        count: count as number,
      }));

      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Credit Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (report.report_type === "DEFAULT_PREDICTION" && data.risk_distribution) {
      const chartData = Object.entries(data.risk_distribution).map(([risk, count]) => ({
        risk,
        count: count as number,
        fill: getColorForRiskLevel(risk),
      }));

      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Default Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="risk"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (report.report_type === "PORTFOLIO_RISK" && data.loan_type_exposure) {
      const chartData = Object.entries(data.loan_type_exposure).map(([type, amount]) => ({
        type,
        amount: amount as number,
      }));

      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Portfolio Exposure by Loan Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={120} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Exposure']} />
                <Bar dataKey="amount" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // Default visualization for other report types
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Report Data
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <pre className="whitespace-pre-wrap overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const getColorForRiskLevel = (riskLevel: string) => {
    if (riskLevel.includes("Very High")) return "#EF4444";
    if (riskLevel.includes("High")) return "#F97316";
    if (riskLevel.includes("Moderate")) return "#EAB308";
    if (riskLevel.includes("Low")) return "#22C55E";
    if (riskLevel.includes("Very Low")) return "#10B981";
    return "#6B7280";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {report.title}
              </h2>
            </div>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-full">
              {report.report_type.replace(/_/g, " ").toLowerCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onExport && (
              <div className="flex space-x-2">
                {["pdf", "excel", "csv"].map((format) => (
                  <button
                    key={format}
                    onClick={() => onExport(format)}
                    className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span className="uppercase">{format}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { key: "overview", label: "Overview", icon: FiInfo },
            { key: "data", label: "Data", icon: FiBarChart },
            { key: "visualizations", label: "Visualizations", icon: FiPieChart },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Created By
                    </h4>
                    <div className="flex items-center space-x-2">
                      <FiUser className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {report.created_by.first_name} {report.created_by.last_name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Created At
                    </h4>
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </div>

                  {report.generated_at && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Generated At
                      </h4>
                      <div className="flex items-center space-x-2">
                        <FiClock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {formatDate(report.generated_at)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon()}
                      <span className="text-gray-900 dark:text-white">
                        {report.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {report.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-900 dark:text-white">{report.description}</p>
                </div>
              )}

              {/* Summary Data */}
              {report.data?.summary && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Summary
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(report.data.summary).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {typeof value === "number" ? value.toLocaleString() : String(value)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {key.replace(/_/g, " ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Raw Report Data
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(report.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "visualizations" && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Visualizations
              </h4>
              {renderDataVisualizations()}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportViewer;