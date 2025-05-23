import React from "react";
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
import { FiInfo } from "react-icons/fi";

const data = [
  { month: "Jan", feature: "Credit History", value: 0.1 },
  { month: "Jan", feature: "Debt Ratio", value: 0.2 },
  { month: "Jan", feature: "Income", value: 0.3 },
  { month: "Feb", feature: "Credit History", value: 0.2 },
  { month: "Feb", feature: "Debt Ratio", value: 0.3 },
  { month: "Feb", feature: "Income", value: 0.4 },
  { month: "Mar", feature: "Credit History", value: 0.3 },
  { month: "Mar", feature: "Debt Ratio", value: 0.4 },
  { month: "Mar", feature: "Income", value: 0.5 },
  { month: "Apr", feature: "Credit History", value: 0.4 },
  { month: "Apr", feature: "Debt Ratio", value: 0.5 },
  { month: "Apr", feature: "Income", value: 0.6 },
  { month: "May", feature: "Credit History", value: 0.5 },
  { month: "May", feature: "Debt Ratio", value: 0.6 },
  { month: "May", feature: "Income", value: 0.7 },
];

const CustomCell = (props: any) => {
  const { cx, cy, payload, value } = props;
  const radius = Math.sqrt(value) * 30; // Scale based on value

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="#3b82f6"
        fillOpacity={0.7}
        stroke="#1d4ed8"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={10}
        fontWeight="bold"
      >
        {value.toFixed(1)}
      </text>
    </g>
  );
};

const FeatureImportanceScatterMatrix: React.FC = () => {
  const features = Array.from(new Set(data.map((item) => item.feature)));
  const months = Array.from(new Set(data.map((item) => item.month)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Feature Importance Matrix
        </h3>
        <div className="relative group">
          <FiInfo className="h-5 w-5 text-gray-400" />
          <div className="absolute z-10 left-1/2 transform -translate-x-1/2 mt-24 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity w-full">
            Bubble size represents relative feature importance
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 40,
              left: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              name="Month"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis dataKey="feature" name="Feature" tick={{ fontSize: 12 }} />
            <ZAxis dataKey="value" range={[0, 100]} name="Importance" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-medium">{data.feature}</p>
                      <p className="text-sm">Month: {data.month}</p>
                      <p className="text-sm">
                        Importance: {data.value.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Scatter
              name="Feature Importance"
              data={data}
              shape={<CustomCell />}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-300 mr-1"></div>
            <span className="text-xs text-gray-600">Low Importance</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-blue-700 mr-1"></div>
            <span className="text-xs text-gray-600">High Importance</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Normalized scores (0-1 scale)
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureImportanceScatterMatrix;
