import React from 'react';
import EnhancedHelperContent from '../common/EnhancedHelperContent';
import { motion } from 'framer-motion';
import { FiBookOpen, FiHelpCircle, FiTarget, FiZap } from 'react-icons/fi';

const EnhancedHelpersDemo: React.FC = () => {
  const demoSections = [
    {
      title: "What's New in Helper Content",
      content: "Experience our redesigned helper system with rich formatting, visual hierarchy, and comprehensive guidance.",
      type: "info" as const,
      bullets: [
        "Interactive and expandable content",
        "Visual icons and color coding",
        "Multiple sections with clear organization",
        "Examples, formulas, and pro tips"
      ]
    },
    {
      title: "Key Benefits",
      content: "The enhanced helper system makes complex information easy to understand and act upon.",
      type: "success" as const,
      bullets: [
        "Reduced form completion time",
        "Fewer validation errors",
        "Better user confidence",
        "Clearer guidance for complex fields"
      ],
      tip: "Click any help icon in forms to see detailed guidance like this!"
    }
  ];

  const financialExample = [
    {
      title: "Understanding DTI Calculation",
      content: "Your Debt-to-Income ratio is a critical factor in loan approval. Here's how to calculate it accurately:",
      type: "guide" as const,
      formula: "(Total Monthly Debt Payments ÷ Monthly Income) × 100",
      example: "GHS 1,500 debt payments ÷ GHS 5,000 income = 30%"
    },
    {
      title: "What's Considered Good DTI?",
      content: "Different DTI ranges indicate different levels of financial health:",
      type: "tip" as const,
      bullets: [
        "Excellent: Below 20% - Shows strong financial management",
        "Good: 20-35% - Generally acceptable to most lenders", 
        "Fair: 36-42% - May limit loan options or require higher rates",
        "Poor: Above 43% - Significantly impacts loan approval"
      ],
      tip: "Consider paying down existing debts before applying to improve your DTI ratio"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Enhanced Helper Content Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          See how our new helper system makes complex information more readable and actionable
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Helper Demo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiBookOpen className="text-blue-500" />
            Overview Helper
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click the help button below to see a comprehensive overview of the enhanced helper system:
          </p>
          <EnhancedHelperContent
            title="Enhanced Helper System Overview"
            sections={demoSections}
            triggerType="button"
            position="center"
            maxWidth="max-w-2xl"
          />
        </motion.div>

        {/* Complex Helper Demo */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiTarget className="text-purple-500" />
            Financial Field Helper
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Example of a complex financial field with detailed guidance, formulas, and tips:
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Debt-to-Income Ratio (%)
            </span>
            <EnhancedHelperContent
              title="Debt-to-Income Ratio Calculator & Guide"
              sections={financialExample}
              triggerType="icon"
              position="top"
              maxWidth="max-w-lg"
            />
          </div>
        </motion.div>
      </div>

      {/* Feature Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FiZap className="text-yellow-500" />
          Before vs After Comparison
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-red-600">
              ❌ Before (Old System)
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Simple tooltip with cramped text</li>
              <li>• No visual hierarchy or formatting</li>
              <li>• Limited space for complex information</li>
              <li>• No examples or formulas</li>
              <li>• Poor mobile experience</li>
            </ul>
          </div>

          {/* After */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-green-600">
              ✅ After (Enhanced System)
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Rich, expandable content with sections</li>
              <li>• Visual icons and color-coded information</li>
              <li>• Organized bullets, examples, and formulas</li>
              <li>• Pro tips and actionable guidance</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Usage Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Where You'll See Enhanced Helpers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FiHelpCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Loan Applications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Personal info, financial details, employment</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FiTarget className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Risk Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Complex calculations and metrics</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FiBookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Settings & Config</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Account settings and preferences</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedHelpersDemo;