import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { FiInfo, FiTrendingUp } from "react-icons/fi";
import type { RiskExplanation, ModelPrediction } from "../../../../components/redux/features/api/risk/riskApi";

interface FeatureImportanceHeatmapProps {
  riskExplanation?: RiskExplanation;
  modelPredictions?: ModelPrediction[];
}

const fallbackData = [
  { category: "Financial", feature: "Credit History", value: 0.8, importance: 0.8 },
  { category: "Financial", feature: "Debt Ratio", value: 0.7, importance: 0.7 },
  { category: "Financial", feature: "Income", value: 0.9, importance: 0.9 },
  { category: "Employment", feature: "Job Stability", value: 0.6, importance: 0.6 },
  { category: "Employment", feature: "Employment Type", value: 0.5, importance: 0.5 },
  { category: "Employment", feature: "Income Verification", value: 0.7, importance: 0.7 },
  { category: "Personal", feature: "Age", value: 0.3, importance: 0.3 },
  { category: "Personal", feature: "Marital Status", value: 0.2, importance: 0.2 },
  { category: "Personal", feature: "Address History", value: 0.4, importance: 0.4 },
];

// Remove CustomCell component as we're using a grid layout instead

const FeatureImportanceScatterMatrix: React.FC<FeatureImportanceHeatmapProps> = ({ 
  riskExplanation, 
  modelPredictions 
}) => {
  const chartData = useMemo(() => {
    if (!riskExplanation?.key_factors) {
      return fallbackData;
    }
    
    // Transform backend data into chart format
    const categories = ['Financial', 'Employment', 'Personal', 'Other'];
    return Object.entries(riskExplanation.key_factors)
      .map(([feature, data]: [string, any], index) => {
        const formattedFeature = feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const importance = Math.abs(data.importance || data.shap_value || 0);
        
        // Categorize based on feature name
        let category = 'Other';
        if (feature.includes('income') || feature.includes('debt') || feature.includes('credit')) {
          category = 'Financial';
        } else if (feature.includes('employment') || feature.includes('job') || feature.includes('work')) {
          category = 'Employment';
        } else if (feature.includes('age') || feature.includes('marital') || feature.includes('address')) {
          category = 'Personal';
        }
        
        return {
          category,
          feature: formattedFeature,
          value: importance,
          importance,
          x: index % 3, // Position on x-axis
          y: Math.floor(index / 3) // Position on y-axis
        };
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 12); // Show top 12 features
  }, [riskExplanation]);
  
  const features = Array.from(new Set(chartData.map((item) => item.feature)));
  const categories = Array.from(new Set(chartData.map((item) => item.category)));
  const hasRealData = !!riskExplanation?.key_factors;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Feature Importance Analysis
          </h3>
          {!hasRealData && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Showing sample data - Generate explanation for real analysis
            </p>
          )}
        </div>
        <div className="relative group">
          <FiInfo className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <div className="absolute z-10 right-0 mt-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity w-48">
            Shows relative importance of each feature in the risk assessment model
          </div>
        </div>
      </div>

      {/* Feature Importance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {chartData.map((item, index) => {
          const importanceLevel = item.importance > 0.7 ? 'high' : item.importance > 0.4 ? 'medium' : 'low';
          const colorClass = {
            high: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            medium: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
            low: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }[importanceLevel];
          
          const textColorClass = {
            high: 'text-red-800 dark:text-red-200',
            medium: 'text-yellow-800 dark:text-yellow-200',
            low: 'text-green-800 dark:text-green-200'
          }[importanceLevel];
          
          return (
            <div key={index} className={`p-4 rounded-lg border-2 ${colorClass} transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {item.category}
                </span>
                <FiTrendingUp className={`h-4 w-4 ${textColorClass}`} />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                {item.feature}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        importanceLevel === 'high' ? 'bg-red-500' :
                        importanceLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, item.importance * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`ml-3 text-sm font-semibold ${textColorClass}`}>
                  {(item.importance * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Low Impact (0-40%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Medium Impact (40-70%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">High Impact (70%+)</span>
          </div>
        </div>
        
        {hasRealData && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
            Based on real model analysis
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FeatureImportanceScatterMatrix;
