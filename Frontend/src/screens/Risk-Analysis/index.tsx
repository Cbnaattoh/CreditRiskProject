import React from "react";
import { motion } from "framer-motion";
import RiskLevelChart from "./components/RiskLevelChart";
import ConfidenceScore from "./components/ConfidenceScore";
import ComparativeAnalysisTable from "./components/ComparativeAnalysisTable";
import ScenarioSimulationForm from "./components/ScenarioSimulationForm";
import DownloadReportButton from "./components/DownloadReportButton";

const PredictionOutcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Risk Prediction Outcome
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive analysis of the applicant's credit risk profile
          </p>
        </motion.div>

        {/* Risk Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Risk Level Distribution
            </h2>
            <div className="h-64">
              <RiskLevelChart />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <ConfidenceScore score={82} />
          </motion.div>
        </div>

        {/* Comparative Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ComparativeAnalysisTable />
        </motion.div>

        {/* Scenario Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Key Risk Factors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  factor: "High Debt-to-Income Ratio",
                  impact: "High",
                  trend: "Increasing",
                },
                {
                  factor: "Short Credit History",
                  impact: "Medium",
                  trend: "Stable",
                },
                {
                  factor: "Recent Late Payments",
                  impact: "High",
                  trend: "Increasing",
                },
                {
                  factor: "Credit Utilization",
                  impact: "Medium",
                  trend: "Decreasing",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900">{item.factor}</h3>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>
                      Impact: <strong>{item.impact}</strong>
                    </span>
                    <span>
                      Trend: <strong>{item.trend}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <ScenarioSimulationForm />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-end"
        >
          <DownloadReportButton
            riskData={{
              riskLevel: "High Risk",
              confidenceScore: 82,
              metrics: [
                {
                  name: "Monthly Income",
                  applicantValue: "GHS 4,000",
                  portfolioAvg: "GHS 3,200",
                  comparison: "better",
                },
              ],
              keyFactors: [
                {
                  factor: "High Debt-to-Income Ratio",
                  impact: "High",
                  trend: "Increasing",
                },
              ],
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PredictionOutcome;
