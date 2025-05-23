import React from "react";
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

const data = [
  { feature: "Credit History Length", value: -45, impact: "Positive" },
  { feature: "High Debt Ratio", value: 30, impact: "Negative" },
  { feature: "Low Monthly Income", value: 25, impact: "Negative" },
  { feature: "Stable Employment", value: -40, impact: "Positive" },
  { feature: "Multiple Bank Accounts", value: 20, impact: "Negative" },
];

const ShapFeatureImpact: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          SHAP Feature Impact
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-600">Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600">Negative</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 40,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              domain={[-50, 50]}
              tickFormatter={(value) => `${Math.abs(value)}%`}
            />
            <YAxis
              dataKey="feature"
              type="category"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [`${Math.abs(value)}%`, "Impact"]}
              labelFormatter={(label) => `Feature: ${label}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "12px",
              }}
            />
            <Bar dataKey="value" name="Impact" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <React.Fragment key={`cell-${index}`}>
                  {entry.value < 0 ? (
                    <rect
                      x={entry.value}
                      width={Math.abs(entry.value)}
                      fill="#10b981" // Green for positive impact
                    />
                  ) : (
                    <rect
                      x={0}
                      width={entry.value}
                      fill="#ef4444" // Red for negative impact
                    />
                  )}
                </React.Fragment>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          SHAP (SHapley Additive exPlanations) values show how each feature
          contributes to the final prediction.
        </p>
      </div>
    </motion.div>
  );
};

export default ShapFeatureImpact;
