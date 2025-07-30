import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RoleData {
  id: number;
  name: string;
  assignment_count: number;
}

interface RoleDistributionChartProps {
  data: RoleData[];
  isLoading?: boolean;
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet  
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5a2b', // brown
  '#6b7280'  // gray
];

export const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({
  data = [],
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-8zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2">No role data available</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((role, index) => ({
    name: role.name,
    value: role.assignment_count,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.payload.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Users: <span className="font-medium text-indigo-600 dark:text-indigo-400">{data.value}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {((data.value / data.payload.total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.value} ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    );
  };

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const enhancedData = chartData.map(item => ({ ...item, total }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enhancedData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {enhancedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary stats */}
      <div className="mt-4 text-center">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {total.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Role Assignments
        </p>
      </div>
    </div>
  );
};