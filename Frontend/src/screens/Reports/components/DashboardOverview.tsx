import React from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiUsers,
  FiBarChart,
  FiPlus,
  FiEye,
  FiDownload,
} from "react-icons/fi";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { DashboardData, Report } from "../../../components/redux/features/api/reports/reportsApi";

interface DashboardOverviewProps {
  data?: DashboardData;
  isLoading: boolean;
  onCreateReport: () => void;
  onViewReport: (report: Report) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  isLoading,
  onCreateReport,
  onViewReport,
}) => {
  const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444"];

  const pieData = data ? [
    { name: "Completed", value: data.completed_reports, color: "#10B981" },
    { name: "Pending", value: data.pending_reports, color: "#F59E0B" },
    { name: "Failed", value: data.failed_reports, color: "#EF4444" },
  ].filter(item => item.value > 0) : [];

  const reportTypeData = data ? Object.entries(data.reports_by_type).map(([key, value]) => ({
    name: value.name,
    count: value.count,
  })) : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30"
            >
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 opacity-60"></div>
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-gray-300 dark:border-gray-600 rounded-full opacity-40"></div>
              <div className="absolute w-20 h-20 border-2 border-gray-300 dark:border-gray-600 rounded-full opacity-60"></div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-4 opacity-60"></div>
            <div className="h-48 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-end space-x-2 h-6">
                  <div className="w-8 bg-gray-300 dark:bg-gray-600 rounded opacity-40" style={{height: `${Math.random() * 100 + 20}%`}}></div>
                  <div className="w-8 bg-gray-300 dark:bg-gray-600 rounded opacity-40" style={{height: `${Math.random() * 100 + 20}%`}}></div>
                  <div className="w-8 bg-gray-300 dark:bg-gray-600 rounded opacity-40" style={{height: `${Math.random() * 100 + 20}%`}}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FiFileText className="mx-auto text-6xl text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No dashboard data available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load dashboard overview at this time.
        </p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Reports",
      value: data.total_reports,
      icon: FiFileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Completed",
      value: data.completed_reports,
      icon: FiCheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Pending",
      value: data.pending_reports,
      icon: FiClock,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Failed",
      value: data.failed_reports,
      icon: FiAlertCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-600 dark:text-red-400",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Status Distribution
            </h3>
            <div className="w-3 h-3 bg-green-400 rounded-full opacity-60" />
          </div>

          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Report Types */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Report Types
            </h3>
            <div className="w-3 h-3 bg-blue-400 rounded-full opacity-60" />
          </div>

          {reportTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reportTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Reports
          </h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateReport}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FiPlus className="h-4 w-4" />
            <span>New Report</span>
          </motion.button>
        </div>

        {data.recent_reports.length > 0 ? (
          <div className="space-y-3">
            {data.recent_reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => onViewReport(report)}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <FiFileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {report.report_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <FiEye className="h-3 w-3" />
                    <span>{report.views_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiDownload className="h-3 w-3" />
                    <span>{report.downloads_count}</span>
                  </div>
                  <span className="text-xs">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiFileText className="mx-auto text-4xl text-gray-400 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              No reports yet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create your first report to get started
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateReport}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FiPlus className="h-4 w-4" />
              <span>Create Report</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardOverview;