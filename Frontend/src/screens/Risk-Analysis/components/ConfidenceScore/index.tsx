import React from "react";
import { motion } from "framer-motion";
import { FiInfo, FiTrendingUp } from "react-icons/fi";
import type { ModelPrediction } from "../../../../components/redux/features/api/risk/riskApi";

interface ConfidenceScoreProps {
  score: number;
  modelPredictions?: ModelPrediction[];
}

const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ 
  score = 80, 
  modelPredictions 
}) => {
  const hasRealData = !!modelPredictions && modelPredictions.length > 0;
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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiTrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Model Confidence
          </h3>
          {!hasRealData && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Sample score - Run analysis for real confidence
            </p>
          )}
        </div>
        <div className="relative group">
          <FiInfo className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <div className="absolute z-10 right-0 mt-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity w-48">
            Measures how reliable the model's risk assessment is for this application
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-3 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confidence: {score}%
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full ${getColor(
              score
            )} text-white font-medium`}
          >
            {getRemark(score)}
          </span>
        </div>

        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className={`h-full ${getColor(score)} relative`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full"></div>
          </motion.div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span className="text-center">25%</span>
          <span className="text-center">50%</span>
          <span className="text-center">75%</span>
          <span className="text-right">100%</span>
        </div>
        
        {/* Model Information */}
        {hasRealData && modelPredictions && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Prediction Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Model Version:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {modelPredictions[0].model_version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Generated:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(modelPredictions[0].prediction_date).toLocaleDateString()}
                </span>
              </div>
              {modelPredictions[0].explanation && (
                <div className="mt-3">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">Note:</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                    {modelPredictions[0].explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ConfidenceScore;
