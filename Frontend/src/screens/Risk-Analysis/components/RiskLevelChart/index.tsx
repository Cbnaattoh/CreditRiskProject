import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import type { RiskAssessment, RiskAnalysisData } from "../../../../components/redux/features/api/risk/riskApi";

interface RiskLevelChartProps {
  riskAssessment?: RiskAssessment;
  riskAnalysis?: RiskAnalysisData;
}

const fallbackData = [
  { name: "High Risk", value: 80 },
  { name: "Medium Risk", value: 15 },
  { name: "Low Risk", value: 5 },
];

const COLORS = ["#ef4444", "#f59e0b", "#10b981"];

const RiskLevelChart: React.FC<RiskLevelChartProps> = ({ 
  riskAssessment, 
  riskAnalysis 
}) => {
  const chartData = useMemo(() => {
    if (!riskAssessment?.risk_score) {
      return fallbackData;
    }
    
    const score = riskAssessment.risk_score;
    
    // Convert risk score to risk distribution
    // Higher score = lower risk in our system
    if (score >= 700) {
      return [
        { name: "Low Risk", value: 70 },
        { name: "Medium Risk", value: 25 },
        { name: "High Risk", value: 5 },
      ];
    } else if (score >= 500) {
      return [
        { name: "Medium Risk", value: 60 },
        { name: "Low Risk", value: 25 },
        { name: "High Risk", value: 15 },
      ];
    } else {
      return [
        { name: "High Risk", value: 70 },
        { name: "Medium Risk", value: 25 },
        { name: "Low Risk", value: 5 },
      ];
    }
  }, [riskAssessment]);
  
  const hasRealData = !!riskAssessment?.risk_score;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      {!hasRealData && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-center">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Sample data - Run analysis for real distribution
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
            fontSize={12}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              color: "#111827",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              padding: "12px",
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {hasRealData && riskAssessment && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Risk Score</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {Math.round(riskAssessment.risk_score || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Risk Rating</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {riskAssessment.risk_rating || 'Pending'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RiskLevelChart;
