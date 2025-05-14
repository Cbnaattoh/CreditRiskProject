import React from "react";
import { motion } from "framer-motion";

interface MetricRow {
  metric: string;
  applicant: string | number;
  portfolioAvg: string | number;
  isBetter?: boolean;
}

const ComparativeAnalysisTable: React.FC = () => {
  const data: MetricRow[] = [
    {
      metric: "Monthly Income",
      applicant: "GHS 4,000",
      portfolioAvg: "GHS 3,200",
      isBetter: true,
    },
    {
      metric: "Debt Ratio",
      applicant: "45%",
      portfolioAvg: "32%",
      isBetter: false,
    },
    {
      metric: "Credit History Age",
      applicant: "3 years",
      portfolioAvg: "5 years",
      isBetter: false,
    },
    {
      metric: "Payment Delinquency",
      applicant: "2%",
      portfolioAvg: "5%",
      isBetter: true,
    },
    {
      metric: "Credit Utilization",
      applicant: "65%",
      portfolioAvg: "48%",
      isBetter: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparative Analysis
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portfolio Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comparison
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.applicant}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.portfolioAvg}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.isBetter ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Better
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Worse
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ComparativeAnalysisTable;
