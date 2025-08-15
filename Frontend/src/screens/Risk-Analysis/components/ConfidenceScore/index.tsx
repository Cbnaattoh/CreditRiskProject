import React from "react";
import { motion } from "framer-motion";
import { FiInfo, FiTrendingUp } from "react-icons/fi";
import type { ModelPrediction } from "../../../../components/redux/features/api/risk/riskApi";
import type { MLCreditAssessment } from "../../../../components/redux/features/api/applications/applicationsApi";

interface ConfidenceScoreProps {
  score: number;
  modelPredictions?: ModelPrediction[];
  mlAssessment?: MLCreditAssessment;
}

const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ 
  score = 80, 
  modelPredictions,
  mlAssessment 
}) => {
  const hasRealData = !!(mlAssessment || (modelPredictions && modelPredictions.length > 0));
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
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 h-full flex flex-col overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-orange-500/5"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl">
                <FiTrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 dark:from-white dark:to-amber-200 bg-clip-text text-transparent">
                Model Confidence
              </h3>
            </div>
            {!hasRealData && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Sample score - ML assessment recommended for real confidence
              </p>
            )}
            {mlAssessment && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ML assessment confidence score
              </p>
            )}
          </div>
          <div className="relative group">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <FiInfo className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="absolute z-20 right-0 mt-2 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity w-64 shadow-xl">
              Measures how reliable the model's risk assessment is for this application
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Confidence: 
              </span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {score}%
              </span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className={`text-sm px-4 py-2 rounded-xl text-white font-bold shadow-lg ${
                  score >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                  score >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                  score >= 40 ? 'bg-gradient-to-r from-orange-500 to-yellow-600' :
                  'bg-gradient-to-r from-red-500 to-orange-600'
                }`}
              >
                {getRemark(score)}
              </motion.span>
            </div>
          </div>

          <div className="mb-6">
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                className={`h-full relative overflow-hidden ${
                  score >= 90 ? 'bg-gradient-to-r from-emerald-400 to-green-600' :
                  score >= 75 ? 'bg-gradient-to-r from-green-400 to-emerald-600' :
                  score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-amber-600' :
                  score >= 40 ? 'bg-gradient-to-r from-orange-400 to-yellow-600' :
                  'bg-gradient-to-r from-red-400 to-orange-600'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span className="text-center">25%</span>
            <span className="text-center">50%</span>
            <span className="text-center">75%</span>
            <span className="text-right">100%</span>
          </div>
        </div>
        
        {/* Premium Model Information */}
        {hasRealData && (mlAssessment || modelPredictions) && (
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <FiInfo className="h-3 w-3 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                Assessment Details
              </h4>
            </div>
            <div className="space-y-3 text-sm bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-blue-900/20 p-4 rounded-xl">
              {mlAssessment && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Model Version:</span>
                    <span className="font-bold text-gray-900 dark:text-white px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      v{mlAssessment.model_version}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Generated:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {new Date(mlAssessment.prediction_timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Processing Time:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {mlAssessment.processing_time_ms ? `${mlAssessment.processing_time_ms}ms` : 'N/A'}
                    </span>
                  </div>
                  {mlAssessment.model_accuracy && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Model Accuracy:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {mlAssessment.model_accuracy}%
                      </span>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-green-700 dark:text-green-300 text-sm font-bold">Status:</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        mlAssessment.processing_status === 'COMPLETED' ? 'bg-green-500 text-white' :
                        mlAssessment.processing_status === 'FAILED' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {mlAssessment.processing_status}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Risk Level: <span className="font-bold">{mlAssessment.risk_level}</span>
                    </p>
                  </div>
                </>
              )}
              {!mlAssessment && modelPredictions && (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ConfidenceScore;
