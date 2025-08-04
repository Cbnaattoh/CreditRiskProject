import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PermissionUsageChartProps {
  data: {
    assignments_24h: number;
    permission_checks_24h: number;
  };
  isLoading?: boolean;
}

export const PermissionUsageChart: React.FC<PermissionUsageChartProps> = ({
  data,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Role Assignments',
      value: data?.assignments_24h || 0,
      color: '#6366f1',
      description: 'New role assignments in the last 24 hours'
    },
    {
      name: 'Permission Checks',
      value: data?.permission_checks_24h || 0,
      color: '#8b5cf6',
      description: 'Permission verifications performed'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.payload.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Count: <span className="font-medium text-indigo-600 dark:text-indigo-400">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {data.payload.description}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            Last 24 hours
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || (data.assignments_24h === 0 && data.permission_checks_24h === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2">No activity data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Role Assignments
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.assignments_24h.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            New assignments today
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-violet-600 rounded-full mr-2"></div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Permission Checks
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.permission_checks_24h.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Security verifications
          </p>
        </div>
      </div>
    </div>
  );
};