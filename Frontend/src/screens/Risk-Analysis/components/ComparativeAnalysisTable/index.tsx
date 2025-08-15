import React from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiBarChart, FiActivity, FiShield, FiZap } from "react-icons/fi";
import type { MLCreditAssessment } from "../../../../components/redux/features/api/applications/applicationsApi";
import type { CreditApplication } from "../../../../components/redux/features/api/applications/applicationsApi";

interface MetricRow {
  metric: string;
  applicant: string | number;
  portfolioAvg: string | number;
  comparison: 'better' | 'worse' | 'neutral';
  category: 'financial' | 'credit' | 'demographic' | 'ml';
  icon: React.ReactNode;
  description?: string;
}

interface ComparativeAnalysisTableProps {
  riskAnalysis?: any;
  application?: CreditApplication;
  mlAssessment?: MLCreditAssessment;
}

const ComparativeAnalysisTable: React.FC<ComparativeAnalysisTableProps> = ({
  riskAnalysis,
  application,
  mlAssessment
}) => {
  // Generate dynamic data based on available information
  const generateMetrics = (): MetricRow[] => {
    const metrics: MetricRow[] = [];

    // ML Assessment Metrics (if available)
    if (mlAssessment) {
      metrics.push({
        metric: "Credit Score",
        applicant: mlAssessment.credit_score,
        portfolioAvg: "650",
        comparison: mlAssessment.credit_score >= 650 ? 'better' : 'worse',
        category: 'ml',
        icon: <FiBarChart className="h-4 w-4" />,
        description: `AI-generated credit score based on comprehensive analysis`
      });

      metrics.push({
        metric: "Risk Level",
        applicant: mlAssessment.risk_level,
        portfolioAvg: "Medium Risk",
        comparison: mlAssessment.risk_level === 'Low Risk' ? 'better' : 
                   mlAssessment.risk_level === 'Medium Risk' ? 'neutral' : 'worse',
        category: 'ml',
        icon: <FiShield className="h-4 w-4" />,
        description: "AI-powered risk assessment"
      });

      metrics.push({
        metric: "Model Confidence",
        applicant: `${mlAssessment.confidence.toFixed(1)}%`,
        portfolioAvg: "82%",
        comparison: mlAssessment.confidence >= 82 ? 'better' : 'worse',
        category: 'ml',
        icon: <FiZap className="h-4 w-4" />,
        description: "Confidence level of the AI model's prediction"
      });

      if (mlAssessment.ghana_employment_score) {
        metrics.push({
          metric: "Ghana Employment Score",
          applicant: `${mlAssessment.ghana_employment_score}/100`,
          portfolioAvg: "68/100",
          comparison: mlAssessment.ghana_employment_score >= 68 ? 'better' : 'worse',
          category: 'demographic',
          icon: <FiActivity className="h-4 w-4" />,
          description: "Ghana-specific employment stability assessment"
        });
      }
    }

    // Application-based metrics
    if (application) {
      // Income from employment info
      const currentEmployment = application.applicant_info?.employment_history?.find(emp => emp.is_current);
      if (currentEmployment?.monthly_income) {
        const income = parseFloat(currentEmployment.monthly_income);
        metrics.push({
          metric: "Monthly Income",
          applicant: `GHS ${income.toLocaleString()}`,
          portfolioAvg: "GHS 3,200",
          comparison: income >= 3200 ? 'better' : 'worse',
          category: 'financial',
          icon: <FiTrendingUp className="h-4 w-4" />,
          description: "Verified monthly income from employment"
        });
      }

      // Debt to income ratio
      if (application.debt_to_income_ratio) {
        metrics.push({
          metric: "Debt-to-Income Ratio",
          applicant: `${application.debt_to_income_ratio}%`,
          portfolioAvg: "32%",
          comparison: application.debt_to_income_ratio <= 32 ? 'better' : 'worse',
          category: 'financial',
          icon: <FiTrendingDown className="h-4 w-4" />,
          description: "Ratio of total debt to monthly income"
        });
      }

      // Credit history length
      if (application.credit_history_length) {
        metrics.push({
          metric: "Credit History Age",
          applicant: `${application.credit_history_length} years`,
          portfolioAvg: "5 years",
          comparison: application.credit_history_length >= 5 ? 'better' : 'worse',
          category: 'credit',
          icon: <FiBarChart className="h-4 w-4" />,
          description: "Length of credit history"
        });
      }

      // Delinquencies
      if (application.delinquencies_2yr !== null && application.delinquencies_2yr !== undefined) {
        metrics.push({
          metric: "Recent Delinquencies",
          applicant: `${application.delinquencies_2yr}`,
          portfolioAvg: "1.2",
          comparison: application.delinquencies_2yr <= 1.2 ? 'better' : 'worse',
          category: 'credit',
          icon: <FiMinus className="h-4 w-4" />,
          description: "Number of delinquencies in the last 2 years"
        });
      }
    }

    // Fallback sample data if no real data is available
    if (metrics.length === 0) {
      return [
        {
          metric: "Monthly Income",
          applicant: "GHS 4,000",
          portfolioAvg: "GHS 3,200",
          comparison: 'better',
          category: 'financial',
          icon: <FiTrendingUp className="h-4 w-4" />,
          description: "Sample financial data"
        },
        {
          metric: "Debt Ratio",
          applicant: "45%",
          portfolioAvg: "32%",
          comparison: 'worse',
          category: 'financial',
          icon: <FiTrendingDown className="h-4 w-4" />,
          description: "Sample debt ratio"
        },
        {
          metric: "Credit History Age",
          applicant: "3 years",
          portfolioAvg: "5 years",
          comparison: 'worse',
          category: 'credit',
          icon: <FiBarChart className="h-4 w-4" />,
          description: "Sample credit history"
        }
      ];
    }

    return metrics;
  };

  const data = generateMetrics();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ml': return 'from-blue-500 to-indigo-600';
      case 'financial': return 'from-green-500 to-emerald-600';
      case 'credit': return 'from-purple-500 to-violet-600';
      case 'demographic': return 'from-orange-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getComparisonIcon = (comparison: string) => {
    switch (comparison) {
      case 'better': return <FiTrendingUp className="h-4 w-4" />;
      case 'worse': return <FiTrendingDown className="h-4 w-4" />;
      default: return <FiMinus className="h-4 w-4" />;
    }
  };

  const getComparisonColor = (comparison: string) => {
    switch (comparison) {
      case 'better': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'worse': return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5"></div>
      
      <div className="relative z-10 p-8">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl">
              <FiBarChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-green-900 dark:from-white dark:via-emerald-200 dark:to-green-200 bg-clip-text text-transparent">
                Comparative Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                Applicant metrics vs. portfolio benchmarks
              </p>
            </div>
          </div>
          {mlAssessment && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <FiZap className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">AI-Enhanced</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Premium Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -2, scale: 1.02 }}
              className="group relative p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-600/60 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 hover:shadow-xl backdrop-blur-sm overflow-hidden"
            >
              {/* Category indicator */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getCategoryColor(row.category)}`}></div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-12 h-12 border border-current rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border border-current rounded-full"></div>
              </div>

              <div className="relative z-10">
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-gradient-to-r ${getCategoryColor(row.category)} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {row.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                        {row.metric}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">
                        {row.category} metric
                      </p>
                    </div>
                  </div>
                  
                  {/* Comparison Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-xl font-bold text-sm shadow-lg ${getComparisonColor(row.comparison)}`}
                  >
                    {getComparisonIcon(row.comparison)}
                    <span className="capitalize">{row.comparison}</span>
                  </motion.div>
                </div>

                {/* Values Comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Applicant</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{row.applicant}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Portfolio Avg</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{row.portfolioAvg}</p>
                  </div>
                </div>

                {/* Description */}
                {row.description && (
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {row.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data Source Indicator */}
        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">ML Assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Financial Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Credit History</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Demographics</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComparativeAnalysisTable;
