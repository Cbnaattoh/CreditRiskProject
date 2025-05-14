import React from "react";
import { motion } from "framer-motion";
import { FiInfo } from "react-icons/fi";

interface ConfidenceScoreProps {
  score: number;
}

const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ score = 80 }) => {
  const getRemark = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Low";
  };

  const getColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 75) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Confidence Score
        </h3>
        <div className="relative group">
          <FiInfo className="h-5 w-5 text-gray-400" />
          <div className="absolute z-10 left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity w-48">
            Measures the reliability of this risk assessment
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Score: {score}%
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getColor(
              score
            )} text-white`}
          >
            {getRemark(score)}
          </span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full ${getColor(score)}`}
          />
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1 text-xs text-gray-500">
          <span>0%</span>
          <span className="text-center">25%</span>
          <span className="text-center">50%</span>
          <span className="text-center">75%</span>
          <span className="text-right">100%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ConfidenceScore;
