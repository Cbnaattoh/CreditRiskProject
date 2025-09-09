import React from 'react';
import { motion } from 'framer-motion';

interface RBACStatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  isLoading?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  onClick?: () => void;
}

export const RBACStatsCard: React.FC<RBACStatsCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  isLoading = false,
  color = 'indigo',
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 transition-colors duration-200">
        <div className="relative overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-gray-700/20 to-transparent"></div>
          
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-[fadeInOut_1.5s_ease-in-out_infinite]"></div>
            <div className={`p-2 rounded-lg ${colorClasses[color]} animate-[scaleIn_1s_ease-out_infinite_alternate]`}>
              <div className="w-6 h-6 bg-gray-300/60 dark:bg-gray-600/60 rounded"></div>
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-[fadeInOut_1.8s_ease-in-out_infinite]"></div>
            <div className="ml-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-[fadeInOut_1.2s_ease-in-out_infinite]"></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          @keyframes scaleIn {
            0% { transform: scale(0.95); opacity: 0.7; }
            100% { transform: scale(1.02); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 transition-colors duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change && (
          <span className={`ml-2 text-sm font-medium ${trendColors[trend]}`}>
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
};