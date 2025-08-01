import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import type { RiskExplanation, ModelPrediction } from "../../../../components/redux/features/api/risk/riskApi";
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";

interface ShapFeatureImpactProps {
  riskExplanation?: RiskExplanation;
  modelPredictions?: ModelPrediction[];
}

const fallbackData = [
  { feature: "Credit History Length", value: -45, impact: "Positive" },
  { feature: "High Debt Ratio", value: 30, impact: "Negative" },
  { feature: "Low Monthly Income", value: 25, impact: "Negative" },
  { feature: "Stable Employment", value: -40, impact: "Positive" },
  { feature: "Multiple Bank Accounts", value: 20, impact: "Negative" },
];

const ShapFeatureImpact: React.FC<ShapFeatureImpactProps> = ({ 
  riskExplanation, 
  modelPredictions 
}) => {
  const chartData = useMemo(() => {
    if (!riskExplanation?.key_factors) {
      return fallbackData;
    }
    
    // Transform backend data into chart format
    return Object.entries(riskExplanation.key_factors)
      .map(([feature, data]: [string, any]) => ({
        feature: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: (data.importance || data.shap_value || 0) * 100,
        impact: (data.importance || data.shap_value || 0) < 0 ? "Positive" : "Negative",
        rawValue: data.importance || data.shap_value || 0,
        contribution: data.contribution || 0
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 10); // Show top 10 features
  }, [riskExplanation]);
  
  const hasRealData = !!riskExplanation?.key_factors;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            SHAP Feature Impact
          </h3>
          {!hasRealData && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Showing sample data - Generate explanation for real analysis
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiTrendingDown className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Reduces Risk</span>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="h-3 w-3 text-red-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Increases Risk</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 140,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              type="number"
              domain={[Math.min(-50, Math.min(...chartData.map(d => d.value)) - 5), Math.max(50, Math.max(...chartData.map(d => d.value)) + 5)]}
              tickFormatter={(value) => `${Math.abs(value).toFixed(0)}%`}
              tick={{ fontSize: 12, fill: 'currentColor' }}
            />
            <YAxis
              dataKey="feature"
              type="category"
              width={130}
              tick={{ fontSize: 11, fill: 'currentColor' }}
            />
            <Tooltip
              formatter={(value: number, name, props) => {
                const impact = value < 0 ? "Reduces Risk" : "Increases Risk";
                return [`${Math.abs(value).toFixed(1)}%`, impact];
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "12px",
                color: "#111827"
              }}
            />
            <Bar dataKey="value" name="Impact" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <React.Fragment key={`cell-${index}`}>
                  {entry.value < 0 ? (
                    <rect
                      fill="#10b981" // Green for risk reduction
                    />
                  ) : (
                    <rect
                      fill="#ef4444" // Red for risk increase
                    />
                  )}
                </React.Fragment>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            SHAP (SHapley Additive exPlanations) values show how each feature
            contributes to the final prediction.
          </p>
        </div>
        
        {hasRealData && modelPredictions && modelPredictions.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Model Confidence:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {(modelPredictions[0].confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Features Analyzed:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {chartData.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ShapFeatureImpact;
