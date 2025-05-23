import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";

const BiasFairnessAssessment: React.FC = () => {
  const fairnessMetrics = [
    {
      attribute: "Gender",
      disparateImpact: 0.85,
      statisticalParity: 0.02,
      status: "pass",
      threshold: "> 0.8",
    },
    {
      attribute: "Age",
      disparateImpact: 0.92,
      statisticalParity: 0.01,
      status: "pass",
      threshold: "> 0.8",
    },
    {
      attribute: "Region",
      disparateImpact: 0.78,
      statisticalParity: -0.05,
      status: "warning",
      threshold: "> 0.8",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Bias & Fairness Assessment
      </h3>

      <div className="space-y-4">
        {fairnessMetrics.map((metric, index) => (
          <div
            key={index}
            className="border-b border-gray-100 pb-4 last:border-0"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">{metric.attribute}</h4>
              {metric.status === "pass" ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <FiCheckCircle className="mr-1" /> Pass
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <FiAlertCircle className="mr-1" /> Warning
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Disparate Impact:</span>
                <span
                  className={`ml-2 font-medium ${
                    metric.disparateImpact >= 0.8
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {metric.disparateImpact.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  (threshold {metric.threshold})
                </span>
              </div>
              <div>
                <span className="text-gray-500">Statistical Parity:</span>
                <span
                  className={`ml-2 font-medium ${
                    Math.abs(metric.statisticalParity) < 0.05
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {metric.statisticalParity.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg flex items-start">
        <FiInfo className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <p className="text-sm text-blue-800">
            All fairness metrics are within acceptable thresholds except for
            slight regional bias.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Disparate Impact Ratio should be between 0.8 and 1.25
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BiasFairnessAssessment;
