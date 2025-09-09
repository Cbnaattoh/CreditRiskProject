import React from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiUsers,
  FiEye,
  FiDownload,
  FiFileText,
  FiActivity,
  FiBarChart,
  FiPieChart,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ReportAnalytics as ReportAnalyticsType } from "../../../components/redux/features/api/reports/reportsApi";

interface ReportAnalyticsProps {
  data?: ReportAnalyticsType;
  isLoading: boolean;
}

const ReportAnalytics: React.FC<ReportAnalyticsProps> = ({ data, isLoading }) => {
  const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Stats Grid Skeleton */}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FiBarChart className="mx-auto text-6xl text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No analytics data available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Analytics data will appear here once reports are generated.
        </p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Reports",
      value: data.total_reports,
      change: data.growth_rate,
      icon: FiFileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Views",
      value: data.total_views,
      change: null,
      icon: FiEye,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Total Downloads",
      value: data.total_downloads,
      change: null,
      icon: FiDownload,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Avg Views/Report",
      value: data.avg_views_per_report,
      change: null,
      icon: FiActivity,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  // Transform data for charts
  const reportTypeData = Object.entries(data.reports_by_type).map(([key, value]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  const reportStatusData = Object.entries(data.reports_by_status).map(([key, value]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  const growthData = [
    { month: "Last Month", reports: data.reports_last_month },
    { month: "This Month", reports: data.reports_this_month },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label && `${label}: `}
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
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
                  {typeof stat.value === "number"
                    ? stat.value % 1 === 0
                      ? stat.value.toLocaleString()
                      : stat.value.toFixed(1)
                    : stat.value}
                </p>
                {stat.change !== null && (
                  <p className={`text-sm font-medium mt-1 flex items-center space-x-1 ${
                    stat.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    <FiTrendingUp className={`h-3 w-3 ${stat.change < 0 ? "rotate-180" : ""}`} />
                    <span>{Math.abs(stat.change)}%</span>
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Types Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiPieChart className="h-5 w-5" />
              <span>Report Types</span>
            </h3>
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-60" />
          </div>

          {reportTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reportTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </motion.div>

        {/* Report Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiBarChart className="h-5 w-5" />
              <span>Status Distribution</span>
            </h3>
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-60" />
          </div>

          {reportStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportStatusData}>
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
                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </motion.div>

        {/* Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiTrendingUp className="h-5 w-5" />
              <span>Monthly Growth</span>
            </h3>
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-60" />
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="reports"
                stroke="#10B981"
                fill="url(#growthGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Creators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiUsers className="h-5 w-5" />
              <span>Top Report Creators</span>
            </h3>
            <div className="w-3 h-3 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full opacity-60" />
          </div>

          {data.top_creators.length > 0 ? (
            <div className="space-y-4">
              {data.top_creators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {creator.first_name[0]}{creator.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {creator.first_name} {creator.last_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {creator.report_count} reports
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(creator.report_count / Math.max(...data.top_creators.map(c => c.report_count))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {creator.report_count}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No creators data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <FiActivity className="h-5 w-5" />
            <span>Recent Activity</span>
          </h3>
          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-60" />
        </div>

        {data.recent_activity.length > 0 ? (
          <div className="space-y-3">
            {data.recent_activity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    {activity.action === "VIEW" && <FiEye className="h-4 w-4 text-white" />}
                    {activity.action === "DOWNLOAD" && <FiDownload className="h-4 w-4 text-white" />}
                    {activity.action === "SHARE" && <FiUsers className="h-4 w-4 text-white" />}
                    {activity.action === "EXPORT" && <FiFileText className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.user__first_name} {activity.user__last_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.action.toLowerCase()}ed "{activity.report__title}"
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.accessed_at).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ReportAnalytics;