import React from 'react';
import { motion } from 'framer-motion';
import { FiHelpCircle } from 'react-icons/fi';

interface HelpButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline' | 'icon-only';
  tooltip?: string;
  className?: string;
}

const HelpButton: React.FC<HelpButtonProps> = ({
  onClick,
  size = 'md',
  variant = 'inline',
  tooltip = 'Get help',
  className = '',
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return 'fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl z-40';
      case 'icon-only':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400';
      default:
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50';
    }
  };

  if (variant === 'floating') {
    return (
      <motion.button
        onClick={onClick}
        className={`${getSizeClasses()} ${getVariantClasses()} rounded-full flex items-center justify-center transition-all duration-300 group ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={tooltip}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 500, damping: 30 }}
      >
        <FiHelpCircle className="h-6 w-6 group-hover:rotate-12 transition-transform duration-200" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-ping" />
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`${getSizeClasses()} ${getVariantClasses()} rounded-xl flex items-center justify-center transition-all duration-200 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={tooltip}
    >
      <FiHelpCircle className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} group-hover:rotate-12 transition-transform duration-200`} />
    </motion.button>
  );
};

export default HelpButton;