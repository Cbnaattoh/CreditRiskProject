import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiX,
  FiFileText,
  FiCalendar,
  FiSettings,
  FiUsers,
  FiPlus,
} from "react-icons/fi";
import type { GenerateReportRequest } from "../../../components/redux/features/api/reports/reportsApi";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenerateReportRequest) => Promise<void>;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GenerateReportRequest>();

  const reportType = watch("report_type");

  const reportTypes = [
    // Core Reports
    { value: "RISK_SUMMARY", label: "Risk Assessment Summary", description: "Overview of risk assessments and scores" },
    { value: "APPLICATION_ANALYTICS", label: "Application Analytics", description: "Analysis of credit applications and trends" },
    { value: "PERFORMANCE_METRICS", label: "Performance Metrics", description: "System and processing performance data" },
    { value: "COMPLIANCE_AUDIT", label: "Compliance Audit", description: "Compliance status and audit results" },
    { value: "FINANCIAL_OVERVIEW", label: "Financial Overview", description: "Financial metrics and portfolio data" },
    { value: "MONTHLY_SUMMARY", label: "Monthly Summary", description: "Comprehensive monthly report" },
    { value: "QUARTERLY_REPORT", label: "Quarterly Report", description: "Detailed quarterly analysis" },
    
    // Credit Risk Specific Reports
    { value: "CREDIT_SCORE_ANALYSIS", label: "Credit Score Analysis", description: "Detailed analysis of credit score distributions and trends" },
    { value: "DEFAULT_PREDICTION", label: "Default Prediction Report", description: "Probability of default analysis and predictions" },
    { value: "PORTFOLIO_RISK", label: "Portfolio Risk Analysis", description: "Overall portfolio risk assessment and concentration" },
    { value: "UNDERWRITING_PERFORMANCE", label: "Underwriting Performance", description: "Analysis of underwriting decisions and outcomes" },
    { value: "REGULATORY_COMPLIANCE", label: "Regulatory Compliance Report", description: "Compliance with financial regulations and standards" },
    { value: "LOSS_MITIGATION", label: "Loss Mitigation Report", description: "Analysis of potential losses and mitigation strategies" },
    { value: "CONCENTRATION_RISK", label: "Concentration Risk Report", description: "Risk concentration analysis across different dimensions" },
    { value: "MODEL_VALIDATION", label: "ML Model Validation Report", description: "Validation and performance metrics of ML models" },
    { value: "STRESS_TEST", label: "Stress Testing Report", description: "Stress testing under adverse economic scenarios" },
    
    { value: "CUSTOM", label: "Custom Report", description: "Build a custom report with specific parameters" },
  ];

  const handleFormSubmit = async (data: GenerateReportRequest) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
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
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="relative flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Report
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Generate a custom report with your specifications
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6 overflow-y-auto max-h-96">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Report Type *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {reportTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`
                        relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${
                          reportType === type.value
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                        }
                      `}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        {...register("report_type", { required: "Please select a report type" })}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <div className={`
                            w-4 h-4 rounded-full border-2 transition-colors
                            ${
                              reportType === type.value
                                ? "border-indigo-500 bg-indigo-500"
                                : "border-gray-300 dark:border-gray-600"
                            }
                          `}>
                            {reportType === type.value && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                          {type.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.report_type && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.report_type.message}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  {...register("title", { 
                    required: "Report title is required",
                    minLength: { value: 3, message: "Title must be at least 3 characters" },
                    maxLength: { value: 255, message: "Title cannot exceed 255 characters" }
                  })}
                  placeholder="Enter a descriptive title for your report"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Optional description of what this report covers"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      {...register("date_from")}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <FiCalendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      {...register("date_to")}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <FiCalendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              {reportType === "CUSTOM" && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <FiSettings className="h-4 w-4" />
                    <span>Custom Configuration</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Filters (JSON)
                    </label>
                    <textarea
                      {...register("filters")}
                      rows={3}
                      placeholder='{"status": "APPROVED", "amount_range": [1000, 50000]}'
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter custom filters as JSON object
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Configuration (JSON)
                    </label>
                    <textarea
                      {...register("config")}
                      rows={3}
                      placeholder='{"include_charts": true, "format": "detailed"}'
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter report configuration as JSON object
                    </p>
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                onClick={handleSubmit(handleFormSubmit)}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiPlus className="h-4 w-4" />
                    <span>Create Report</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CreateReportModal;