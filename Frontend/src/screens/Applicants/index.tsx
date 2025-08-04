import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiMail,
  FiEye,
  FiX,
  FiBarChart,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiUser,
} from "react-icons/fi";
import { Tooltip } from "@mui/material";
import { useGetApplicationsQuery } from "../../components/redux/features/api/applications/applicationsApi";
import type { CreditApplication } from "../../components/redux/features/api/applications/applicationsApi";
import ErrorBoundary from "../../components/utils/ErrorBoundary";
import { useGetRiskAnalysisQuery } from "../../components/redux/features/api/risk/riskApi";

interface EnhancedApplication extends CreditApplication {
  full_name?: string;
  email?: string;
  phone_number?: string;
  risk_score?: number;
  confidence_score?: number;
  employment_type?: string;
  monthly_income?: string;
  existing_debts?: string;
  bank_statement_count?: number;
}

interface ApplicantsProps {
  showClientView?: boolean;
}

const Applicants: React.FC<ApplicantsProps> = ({ showClientView = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] =
    useState<EnhancedApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine the page title based on route
  const getPageTitle = () => {
    if (showClientView) return "My Applications";
    if (location.pathname.includes('customers')) return "Customers";
    if (location.pathname.includes('loan-applications')) return "All Applications";
    return "Credit Applications";
  };

  // Fetch applications from API
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch,
  } = useGetApplicationsQuery({
    page: currentPage,
    page_size: 20,
    ...(statusFilter !== "ALL" && { status: statusFilter }),
  });

  // API data received successfully
  if (applicationsData) {
    console.log('✅ Applicants: Loaded', applicationsData.length || applicationsData.count || 0, 'applications');
  }

  // Fetch risk analysis for selected applicant
  const { data: riskAnalysis, isLoading: riskLoading } =
    useGetRiskAnalysisQuery(selectedApplicant?.id || "", {
      skip: !selectedApplicant?.id,
    });

  // Enhanced applications with computed fields
  const enhancedApplications = useMemo(() => {
    // Handle both paginated response and direct array
    const applications = applicationsData?.results || applicationsData || [];
    if (!Array.isArray(applications)) return [];

    return applications.map((app): EnhancedApplication => {
      const applicantInfo = app.applicant_info;
      const riskAssessment = app.risk_assessment;
      const documents = app.documents || [];

      return {
        ...app,
        full_name: applicantInfo
          ? `${applicantInfo.first_name} ${applicantInfo.middle_name || ""} ${
              applicantInfo.last_name
            }`.trim()
          : "Unknown Applicant",
        email: applicantInfo?.email || "No email provided",
        phone_number: applicantInfo?.phone_number || "No phone provided",
        risk_score: riskAssessment?.risk_score
          ? Math.round(riskAssessment.risk_score / 10)
          : undefined,
        confidence_score: riskAssessment?.probability_of_default
          ? Math.round((1 - riskAssessment.probability_of_default) * 100)
          : undefined,
        employment_type:
          applicantInfo?.employment_history?.[0]?.employment_type?.replace(
            "_",
            " "
          ) || "Not specified",
        monthly_income: applicantInfo?.employment_history?.[0]?.monthly_income
          ? `GHS ${parseFloat(
              applicantInfo.employment_history[0].monthly_income
            ).toLocaleString()}`
          : "Not provided",
        existing_debts: applicantInfo?.financial_info?.total_liabilities
          ? `GHS ${parseFloat(
              applicantInfo.financial_info.total_liabilities
            ).toLocaleString()}`
          : "Not provided",
        bank_statement_count: documents.filter(
          (doc) => doc.document_type === "BANK_STATEMENT"
        ).length,
      };
    });
  }, [applicationsData]);

  // Filter applications based on search query
  const filteredApplications = useMemo(() => {
    if (!searchQuery) return enhancedApplications;

    const query = searchQuery.toLowerCase();
    return enhancedApplications.filter(
      (app) =>
        app.full_name?.toLowerCase().includes(query) ||
        app.email?.toLowerCase().includes(query) ||
        app.reference_number?.toLowerCase().includes(query) ||
        app.status_display?.toLowerCase().includes(query)
    );
  }, [enhancedApplications, searchQuery]);

  const handleViewDetails = (applicant: EnhancedApplication) => {
    setSelectedApplicant(applicant);
    setIsDetailOpen(true);
  };

  const handleNavigateToRisk = (applicationId: string) => {
    navigate(`/home/risk-analysis/${applicationId}`);
  };

  const handleNavigateToExplainability = (applicationId: string) => {
    navigate(`/home/explainability/${applicationId}`);
  };

  const getRiskColor = (score?: number) => {
    if (!score) return "bg-gray-300 dark:bg-gray-600";
    if (score >= 70) return "bg-red-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-green-500";
  };

  const getRiskLabel = (score?: number) => {
    if (!score) return "No Assessment";
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return "bg-gray-300 dark:bg-gray-600";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <FiCheckCircle className="text-green-500" />;
      case "REJECTED":
        return <FiX className="text-red-500" />;
      case "UNDER_REVIEW":
        return <FiClock className="text-amber-500" />;
      case "NEEDS_INFO":
        return <FiAlertCircle className="text-orange-500" />;
      default:
        return <FiFileText className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "NEEDS_INFO":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 p-6 transition-all duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Unable to fetch applications data. Please try again.
              </p>
              <motion.button
                onClick={() => refetch()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 p-6 transition-all duration-500">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-3">
                {getPageTitle()}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage and review credit applications with real-time risk
                assessment
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto mt-4 lg:mt-0">
              {/* Search */}
              <motion.div
                className="relative flex-grow lg:w-80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or reference..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all text-gray-900 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </motion.div>

              {/* Status Filter */}
              <motion.select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="NEEDS_INFO">Needs Info</option>
              </motion.select>

              {/* Refresh Button */}
              <motion.button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </motion.button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Applications
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {applicationsData?.count || (Array.isArray(applicationsData) ? applicationsData.length : 0)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Under Review
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {
                      enhancedApplications.filter(
                        (app) => app.status === "UNDER_REVIEW"
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                  <FiClock className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Approved
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {
                      enhancedApplications.filter(
                        (app) => app.status === "APPROVED"
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    High Risk
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {
                      enhancedApplications.filter(
                        (app) => (app.risk_score || 0) >= 70
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                  <FiAlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Applications Table */}
          <motion.div
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading applications...
                  </p>
                </div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FiFileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Applications Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "No applications have been submitted yet"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Risk Assessment
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Confidence
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Last Updated
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {filteredApplications.map((application, index) => (
                      <motion.tr
                        key={application.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                              {application.full_name?.charAt(0) || "U"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {application.full_name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {application.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.reference_number || "Pending"}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {application.submission_date
                              ? new Date(
                                  application.submission_date
                                ).toLocaleDateString()
                              : "Not submitted"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(application.status)}
                            <span
                              className={`ml-2 inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {application.status_display || application.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mr-3">
                              <div
                                className={`h-full rounded-full ${getRiskColor(
                                  application.risk_score
                                )}`}
                                style={{
                                  width: `${application.risk_score || 0}%`,
                                }}
                              />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {application.risk_score
                                  ? `${application.risk_score}%`
                                  : "N/A"}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {getRiskLabel(application.risk_score)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mr-3">
                              <div
                                className={`h-full rounded-full ${getConfidenceColor(
                                  application.confidence_score
                                )}`}
                                style={{
                                  width: `${
                                    application.confidence_score || 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {application.confidence_score
                                ? `${application.confidence_score}%`
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(
                            application.last_updated
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <motion.button
                            onClick={() => handleViewDetails(application)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {applicationsData && ((applicationsData.count || (Array.isArray(applicationsData) ? applicationsData.length : 0)) > 20) && (
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Previous
                </motion.button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {Math.ceil((applicationsData.count || (Array.isArray(applicationsData) ? applicationsData.length : 0)) / 20)}
                </span>
                <motion.button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!applicationsData.next}
                  className="px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Enhanced Applicant Details Modal */}
        <AnimatePresence>
          {isDetailOpen && selectedApplicant && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Application Details
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedApplicant.full_name} •{" "}
                        {selectedApplicant.reference_number || "Draft"}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setIsDetailOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiX className="text-gray-500 dark:text-gray-400" />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Applicant Info */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Status and Basic Info */}
                      <div className="bg-gradient-to-r from-white/80 via-blue-50/50 to-indigo-50/80 dark:from-gray-700/80 dark:via-gray-700/60 dark:to-gray-800/80 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Application Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Full Name
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.full_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Email
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Phone
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.phone_number}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Status
                            </p>
                            <div className="flex items-center">
                              {getStatusIcon(selectedApplicant.status)}
                              <span
                                className={`ml-2 inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  selectedApplicant.status
                                )}`}
                              >
                                {selectedApplicant.status_display ||
                                  selectedApplicant.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Employment & Financial Info */}
                      <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Financial Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Employment Type
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.employment_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Monthly Income
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.monthly_income}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Existing Debts
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.existing_debts}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Documents
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.documents?.length || 0}{" "}
                              uploaded
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      {(selectedApplicant.risk_score ||
                        selectedApplicant.confidence_score) && (
                        <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Risk Assessment
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedApplicant.risk_score && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Risk Score
                                  </span>
                                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {selectedApplicant.risk_score}%
                                  </span>
                                </div>
                                <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div
                                    className={`h-full rounded-full ${getRiskColor(
                                      selectedApplicant.risk_score
                                    )}`}
                                    style={{
                                      width: `${selectedApplicant.risk_score}%`,
                                    }}
                                  />
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  {getRiskLabel(selectedApplicant.risk_score)}
                                </p>
                              </div>
                            )}
                            {selectedApplicant.confidence_score && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confidence Score
                                  </span>
                                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {selectedApplicant.confidence_score}%
                                  </span>
                                </div>
                                <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div
                                    className={`h-full rounded-full ${getConfidenceColor(
                                      selectedApplicant.confidence_score
                                    )}`}
                                    style={{
                                      width: `${selectedApplicant.confidence_score}%`,
                                    }}
                                  />
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  {selectedApplicant.confidence_score >= 80
                                    ? "High Confidence"
                                    : selectedApplicant.confidence_score >= 60
                                    ? "Medium Confidence"
                                    : "Low Confidence"}
                                </p>
                              </div>
                            )}
                          </div>
                          {riskAnalysis?.risk_explanation && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                AI Insight
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {riskAnalysis.risk_explanation.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column - Actions & Analytics */}
                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Actions
                        </h3>
                        <div className="space-y-3">
                          <motion.button
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiDownload size={18} />
                            <span>Download Report</span>
                          </motion.button>

                          <motion.button
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiMail size={18} />
                            <span>Contact Applicant</span>
                          </motion.button>

                          {selectedApplicant.id && (
                            <>
                              <motion.button
                                onClick={() => {
                                  handleNavigateToRisk(selectedApplicant.id!);
                                  setIsDetailOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FiBarChart size={18} />
                                <span>Risk Analysis</span>
                              </motion.button>

                              <motion.button
                                onClick={() => {
                                  handleNavigateToExplainability(
                                    selectedApplicant.id!
                                  );
                                  setIsDetailOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FiEye size={18} />
                                <span>Explainability</span>
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Timeline
                        </h3>
                        <div className="space-y-4">
                          {selectedApplicant.submission_date && (
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Application Submitted
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(
                                    selectedApplicant.submission_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Last Updated
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(
                                  selectedApplicant.last_updated
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {selectedApplicant.documents &&
                            selectedApplicant.documents.length > 0 && (
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Documents Uploaded
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {selectedApplicant.documents.length} files
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default Applicants;
