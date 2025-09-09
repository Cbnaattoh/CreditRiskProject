import React from "react";
import { FiCalendar, FiTag, FiSettings } from "react-icons/fi";
import type{ ReportFilters } from "../../../components/redux/features/api/reports/reportsApi";

interface ReportFiltersPanelProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

const ReportFiltersPanel: React.FC<ReportFiltersPanelProps> = ({
  filters,
  onChange,
}) => {
  const reportTypes = [
    { value: "", label: "All Types" },
    // Core Reports
    { value: "RISK_SUMMARY", label: "Risk Summary" },
    { value: "APPLICATION_ANALYTICS", label: "Application Analytics" },
    { value: "PERFORMANCE_METRICS", label: "Performance Metrics" },
    { value: "COMPLIANCE_AUDIT", label: "Compliance Audit" },
    { value: "FINANCIAL_OVERVIEW", label: "Financial Overview" },
    { value: "MONTHLY_SUMMARY", label: "Monthly Summary" },
    { value: "QUARTERLY_REPORT", label: "Quarterly Report" },
    // Credit Risk Specific Reports
    { value: "CREDIT_SCORE_ANALYSIS", label: "Credit Score Analysis" },
    { value: "DEFAULT_PREDICTION", label: "Default Prediction" },
    { value: "PORTFOLIO_RISK", label: "Portfolio Risk" },
    { value: "UNDERWRITING_PERFORMANCE", label: "Underwriting Performance" },
    { value: "REGULATORY_COMPLIANCE", label: "Regulatory Compliance" },
    { value: "LOSS_MITIGATION", label: "Loss Mitigation" },
    { value: "CONCENTRATION_RISK", label: "Concentration Risk" },
    { value: "MODEL_VALIDATION", label: "ML Model Validation" },
    { value: "STRESS_TEST", label: "Stress Testing" },
    { value: "CUSTOM", label: "Custom" },
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "GENERATING", label: "Generating" },
    { value: "COMPLETED", label: "Completed" },
    { value: "FAILED", label: "Failed" },
    { value: "EXPIRED", label: "Expired" },
  ];

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== "");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
          <FiSettings className="h-4 w-4" />
          <span>Filters</span>
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiTag className="inline h-4 w-4 mr-1" />
            Report Type
          </label>
          <select
            value={filters.type || ""}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiSettings className="inline h-4 w-4 mr-1" />
            Status
          </label>
          <select
            value={filters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiCalendar className="inline h-4 w-4 mr-1" />
            From Date
          </label>
          <input
            type="date"
            value={filters.date_from || ""}
            onChange={(e) => handleFilterChange("date_from", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiCalendar className="inline h-4 w-4 mr-1" />
            To Date
          </label>
          <input
            type="date"
            value={filters.date_to || ""}
            onChange={(e) => handleFilterChange("date_to", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {filters.type && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
              Type: {reportTypes.find(t => t.value === filters.type)?.label}
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
            </span>
          )}
          {filters.date_from && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              From: {new Date(filters.date_from).toLocaleDateString()}
            </span>
          )}
          {filters.date_to && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              To: {new Date(filters.date_to).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFiltersPanel;