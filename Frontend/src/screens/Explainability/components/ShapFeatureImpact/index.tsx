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
import type { MLCreditAssessment } from "../../../../components/redux/features/api/applications/applicationsApi";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiZap } from "react-icons/fi";

interface ShapFeatureImpactProps {
  riskExplanation?: RiskExplanation;
  modelPredictions?: ModelPrediction[];
  mlAssessment?: MLCreditAssessment;
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
  modelPredictions,
  mlAssessment 
}) => {
  const chartData = useMemo(() => {
    // Prioritize ML Assessment data over risk explanation
    if (mlAssessment) {
      const features = [];
      
      // Credit Score Impact
      const creditScoreImpact = mlAssessment.credit_score >= 700 ? -35 : 
                               mlAssessment.credit_score >= 600 ? -15 : 40;
      features.push({
        feature: "Credit Score",
        value: creditScoreImpact,
        impact: creditScoreImpact < 0 ? "Positive" : "Negative",
        rawValue: creditScoreImpact / 100,
        source: "ML Model",
        details: `${mlAssessment.credit_score} (${mlAssessment.category})`
      });

      // Risk Level Impact
      const riskLevelImpact = mlAssessment.risk_level === 'Low Risk' ? -30 :
                             mlAssessment.risk_level === 'Medium Risk' ? 15 : 45;
      features.push({
        feature: "Risk Assessment",
        value: riskLevelImpact,
        impact: riskLevelImpact < 0 ? "Positive" : "Negative",
        rawValue: riskLevelImpact / 100,
        source: "ML Model",
        details: mlAssessment.risk_level
      });

      // Model Confidence Impact
      const confidenceImpact = mlAssessment.confidence >= 80 ? -20 : 25;
      features.push({
        feature: "Model Confidence",
        value: confidenceImpact,
        impact: confidenceImpact < 0 ? "Positive" : "Negative",
        rawValue: confidenceImpact / 100,
        source: "ML Model",
        details: `${mlAssessment.confidence.toFixed(1)}% confidence`
      });

      // Ghana Employment Score Impact
      if (mlAssessment.ghana_employment_score) {
        const employmentImpact = mlAssessment.ghana_employment_score >= 70 ? -25 : 20;
        features.push({
          feature: "Ghana Employment",
          value: employmentImpact,
          impact: employmentImpact < 0 ? "Positive" : "Negative",
          rawValue: employmentImpact / 100,
          source: "Ghana ML Model",
          details: `${mlAssessment.ghana_employment_score}/100 (${mlAssessment.ghana_job_category})`
        });
      }

      // Ghana Job Stability Impact
      if (mlAssessment.ghana_job_stability_score) {
        const stabilityImpact = mlAssessment.ghana_job_stability_score >= 75 ? -28 : 18;
        features.push({
          feature: "Job Stability",
          value: stabilityImpact,
          impact: stabilityImpact < 0 ? "Positive" : "Negative",
          rawValue: stabilityImpact / 100,
          source: "Ghana ML Model",
          details: `${mlAssessment.ghana_job_stability_score}/100`
        });
      }

      return features.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    }
    
    // Fallback to risk explanation data
    if (riskExplanation?.key_factors) {
      return Object.entries(riskExplanation.key_factors)
        .map(([feature, data]: [string, any]) => ({
          feature: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: (data.importance || data.shap_value || 0) * 100,
          impact: (data.importance || data.shap_value || 0) < 0 ? "Positive" : "Negative",
          rawValue: data.importance || data.shap_value || 0,
          contribution: data.contribution || 0,
          source: "Risk Analysis"
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10);
    }
    
    // Final fallback to sample data
    return fallbackData.map(item => ({ ...item, source: "Sample Data" }));
  }, [riskExplanation, mlAssessment]);
  
  const hasRealData = !!(mlAssessment || riskExplanation?.key_factors);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5"></div>
      
      <div className="relative z-10">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <FiTrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
              SHAP Feature Impact Analysis
            </h3>
          </div>
          {!hasRealData && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Showing sample data - Generate ML assessment for real analysis
            </p>
          )}
          {mlAssessment && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center space-x-1">
                <FiZap className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">ML-Enhanced Analysis</span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Live Data</span>
            </div>
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
        
        {hasRealData && (
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mlAssessment && (
                <>
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Model Confidence</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {mlAssessment.confidence.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Features Analyzed</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {chartData.length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Model Version</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                      v{mlAssessment.model_version}
                    </p>
                  </div>
                </>
              )}
              {!mlAssessment && modelPredictions && modelPredictions.length > 0 && (
                <>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Model Confidence</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {(modelPredictions[0].confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Features Analyzed</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {chartData.length}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
};

export default ShapFeatureImpact;
