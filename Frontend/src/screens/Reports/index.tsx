import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiDownload,
  FiShare2,
  FiEye,
  FiFilter,
  FiSearch,
  FiBarChart,
  FiTrendingUp,
  FiFileText,
  FiClock,
  FiUsers,
  FiSettings,
  FiRefreshCw,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { useToast } from "../../components/utils/Toast";
import { ProtectedComponent } from "../../components/redux/features/api/RBAC/ProtectedComponent";
import {
  useGetReportsQuery,
  useGetDashboardDataQuery,
  useGetReportAnalyticsQuery,
  useGenerateReportMutation,
  useDeleteReportMutation,
  useLazyExportReportQuery,
  useShareReportMutation,
} from "../../components/redux/features/api/reports/reportsApi";
import type {
  Report,
  ReportFilters,
} from "../../components/redux/features/api/reports/reportsApi";
import {
  useCanViewReports,
  useHasPermission,
} from "../../components/utils/hooks/useRBAC";
import ReportCard from "./components/ReportCard";
import ReportModal from "./components/ReportModal";
import ReportFiltersPanel from "./components/ReportFiltersPanel";
import CreateReportModal from "./components/CreateReportModal";
import DashboardOverview from "./components/DashboardOverview";
import ReportAnalytics from "./components/ReportAnalytics";
import ReportViewer from "./components/ReportViewer";

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "reports" | "analytics"
  >("overview");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "title" | "views_count">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { success, error, info } = useToast();

  // RBAC checks
  const canViewReports = useCanViewReports();
  const canCreateReports = useHasPermission("report_create");
  const canEditReports = useHasPermission("report_edit");
  const canDeleteReports = useHasPermission("report_delete");
  const canExportData = useHasPermission("data_export");
  const canViewAnalytics = useHasPermission("report_admin");

  // API hooks
  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useGetReportsQuery({
    ...filters,
    search: searchQuery,
    page_size: 20,
  });

  const { data: dashboardData, isLoading: dashboardLoading } =
    useGetDashboardDataQuery();
  const { data: analyticsData, isLoading: analyticsLoading } =
    useGetReportAnalyticsQuery();

  const [generateReport] = useGenerateReportMutation();
  const [deleteReport] = useDeleteReportMutation();
  const [exportReport] = useLazyExportReportQuery();
  const [shareReport] = useShareReportMutation();

  // Computed values
  const reports = reportsData?.results || [];
  const totalReports = reportsData?.count || 0;

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [reports, sortBy, sortOrder]);

  const handleCreateReport = async (reportData: any) => {
    try {
      await generateReport(reportData).unwrap();
      success("Report generation started!");
      setShowCreateModal(false);
      refetchReports();
    } catch (err: any) {
      error(err?.data?.message || "Failed to create report");
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId).unwrap();
      success("Report deleted successfully");
      refetchReports();
    } catch (err: any) {
      error(err?.data?.message || "Failed to delete report");
    }
  };

  const handleExportReport = async (reportId: string, format: string) => {
    try {
      const result = await exportReport({ id: reportId, format }).unwrap();

      // Create download link
      const blob = new Blob([result], { type: getContentType(format) });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${reportId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success("Report exported successfully");
    } catch (err: any) {
      error(err?.data?.message || "Failed to export report");
    }
  };

  const handleShareReport = async (reportId: string, userIds: number[]) => {
    try {
      await shareReport({ id: reportId, user_ids: userIds }).unwrap();
      success("Report shared successfully");
    } catch (err: any) {
      error(err?.data?.message || "Failed to share report");
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportViewer(true);
  };

  const handleCloseReportViewer = () => {
    setShowReportViewer(false);
    setSelectedReport(null);
  };

  const getContentType = (format: string) => {
    switch (format) {
      case "pdf":
        return "application/pdf";
      case "excel":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "csv":
        return "text/csv";
      default:
        return "application/octet-stream";
    }
  };

  if (!canViewReports) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <FiFileText className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                {/* <className="h-6 w-6 text-white" /> */}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reports & Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate insights and track performance
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetchReports()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>

              <ProtectedComponent permissions={["report_create"]}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>New Report</span>
                </motion.button>
              </ProtectedComponent>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mt-4">
            {["overview", "reports", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  pb-3 px-1 border-b-2 font-medium text-sm capitalize transition-all duration-200
                  ${
                    activeTab === tab
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardOverview
                data={dashboardData}
                isLoading={dashboardLoading}
                onCreateReport={() => setShowCreateModal(true)}
                onViewReport={(report) => setSelectedReport(report)}
              />
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Filters and Search */}
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Search */}
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="created_at">Date Created</option>
                      <option value="title">Title</option>
                      <option value="views_count">Views</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      {sortOrder === "asc" ? (
                        <FiArrowUp className="h-4 w-4" />
                      ) : (
                        <FiArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                      ${
                        showFilters
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    <FiFilter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <ReportFiltersPanel
                        filters={filters}
                        onChange={setFilters}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reports Grid */}
              {reportsLoading ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 relative overflow-hidden"
                      >
                        {/* Card shimmer */}
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/12 dark:via-gray-300/12 to-transparent" style={{animationDelay: `${i * 0.2}s`}}></div>
                        
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-[fadeInOut_2s_ease-in-out_infinite]" style={{animationDelay: `${i * 0.1}s`}}></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-[fadeInOut_2.3s_ease-in-out_infinite]" style={{animationDelay: `${i * 0.15}s`}}></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-[fadeInOut_2.6s_ease-in-out_infinite]" style={{animationDelay: `${i * 0.2}s`}}></div>
                      </div>
                    ))}
                  </div>

                  <style jsx>{`
                    @keyframes shimmer {
                      100% { transform: translateX(100%); }
                    }
                    @keyframes fadeInOut {
                      0%, 100% { opacity: 0.3; }
                      50% { opacity: 0.6; }
                    }
                  `}</style>
                </>
              ) : sortedReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ReportCard
                        report={report}
                        onView={() => handleViewReport(report)}
                        onExport={
                          canExportData ? handleExportReport : undefined
                        }
                        onShare={handleShareReport}
                        onDelete={
                          canDeleteReports ? handleDeleteReport : undefined
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="mx-auto text-6xl text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No reports found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || Object.keys(filters).length > 0
                      ? "Try adjusting your search or filters"
                      : "Create your first report to get started"}
                  </p>
                  {canCreateReports && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Create Report</span>
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "analytics" && canViewAnalytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReportAnalytics
                data={analyticsData}
                isLoading={analyticsLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && canCreateReports && (
          <CreateReportModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateReport}
          />
        )}

        {selectedReport && !showReportViewer && (
          <ReportModal
            report={selectedReport}
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            onExport={canExportData ? handleExportReport : undefined}
            onShare={handleShareReport}
            onDelete={canDeleteReports ? handleDeleteReport : undefined}
          />
        )}

        {selectedReport && showReportViewer && (
          <ReportViewer
            report={selectedReport}
            isOpen={showReportViewer}
            onClose={handleCloseReportViewer}
            onExport={canExportData ? (format: string) => handleExportReport(selectedReport.id, format) : undefined}
            onShare={canEditReports ? (userIds: number[]) => handleShareReport(selectedReport.id, userIds) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
