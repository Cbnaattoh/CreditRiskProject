import React from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiBarChart3,
  FiActivity,
  FiTrendingUp,
  FiTarget,
  FiPieChart,
  FiZap,
  FiDatabase,
  FiLayers,
  FiFileText,
} from "react-icons/fi";

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  reportTypes: string[];
  count: number;
}

interface ReportCategoriesProps {
  selectedCategory?: string;
  onCategorySelect: (categoryId?: string) => void;
  reportCounts: Record<string, number>;
}

const ReportCategories: React.FC<ReportCategoriesProps> = ({
  selectedCategory,
  onCategorySelect,
  reportCounts,
}) => {
  const categories: ReportCategory[] = [
    {
      id: "risk-analysis",
      name: "Risk Analysis",
      description: "Credit risk assessment and analysis reports",
      icon: FiShield,
      color: "from-red-500 to-orange-600",
      reportTypes: ["RISK_SUMMARY", "DEFAULT_PREDICTION", "PORTFOLIO_RISK", "CONCENTRATION_RISK"],
      count: 0,
    },
    {
      id: "credit-scoring",
      name: "Credit Scoring",
      description: "Credit score analysis and trends",
      icon: FiTrendingUp,
      color: "from-blue-500 to-cyan-600",
      reportTypes: ["CREDIT_SCORE_ANALYSIS", "UNDERWRITING_PERFORMANCE"],
      count: 0,
    },
    {
      id: "compliance",
      name: "Compliance",
      description: "Regulatory compliance and audit reports",
      icon: FiShield,
      color: "from-green-500 to-emerald-600",
      reportTypes: ["COMPLIANCE_AUDIT", "REGULATORY_COMPLIANCE"],
      count: 0,
    },
    {
      id: "ml-validation",
      name: "ML & Validation",
      description: "Machine learning model validation and performance",
      icon: FiActivity,
      color: "from-purple-500 to-violet-600",
      reportTypes: ["MODEL_VALIDATION", "STRESS_TEST"],
      count: 0,
    },
    {
      id: "operations",
      name: "Operations",
      description: "Operational and performance analytics",
      icon: FiBarChart3,
      color: "from-amber-500 to-yellow-600",
      reportTypes: ["APPLICATION_ANALYTICS", "PERFORMANCE_METRICS", "LOSS_MITIGATION"],
      count: 0,
    },
    {
      id: "financial",
      name: "Financial",
      description: "Financial overview and summaries",
      icon: FiPieChart,
      color: "from-indigo-500 to-purple-600",
      reportTypes: ["FINANCIAL_OVERVIEW", "MONTHLY_SUMMARY", "QUARTERLY_REPORT"],
      count: 0,
    },
  ];

  // Calculate counts for each category
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    count: category.reportTypes.reduce((sum, type) => sum + (reportCounts[type] || 0), 0),
  }));

  const totalReports = Object.values(reportCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      {/* All Reports */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCategorySelect(undefined)}
        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
          !selectedCategory
            ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600`}>
              <FiFileText className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all report types
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalReports.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">reports</div>
          </div>
        </div>
      </motion.button>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoriesWithCounts.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategorySelect(category.id)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedCategory === category.id
                ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color}`}>
                  <category.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {category.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">reports</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Category Legend */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
        >
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Report Types in this Category:
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoriesWithCounts
              .find(cat => cat.id === selectedCategory)
              ?.reportTypes.map(type => {
                const displayName = type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                const count = reportCounts[type] || 0;
                return (
                  <span
                    key={type}
                    className="px-2 py-1 bg-white dark:bg-gray-700 text-xs rounded-full border border-gray-200 dark:border-gray-600"
                  >
                    {displayName} ({count})
                  </span>
                );
              })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportCategories;