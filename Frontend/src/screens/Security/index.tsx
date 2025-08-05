import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShield,
  FiActivity,
  FiAlertTriangle,
  FiEye,
  FiSettings,
} from 'react-icons/fi';
import SecurityDashboard from './SecurityDashboard';
import BehavioralBiometrics from './BehavioralBiometrics';
import SuspiciousActivities from './SuspiciousActivities';

// Tab configuration
const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <FiShield className="w-5 h-5" />,
    component: SecurityDashboard,
    description: 'Overview of security metrics and alerts',
  },
  {
    id: 'biometrics',
    label: 'Behavioral Biometrics',
    icon: <FiActivity className="w-5 h-5" />,
    component: BehavioralBiometrics,
    description: 'Monitor user behavioral patterns',
  },
  {
    id: 'activities',
    label: 'Suspicious Activities',
    icon: <FiAlertTriangle className="w-5 h-5" />,
    component: SuspiciousActivities,
    description: 'Investigate suspicious user activities',
  },
];

const TabButton: React.FC<{
  tab: typeof tabs[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ tab, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
      isActive
        ? 'bg-blue-500 text-white shadow-lg'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
    }`}
  >
    {/* Active indicator */}
    {isActive && (
      <motion.div
        layoutId="activeTabIndicator"
        className="absolute inset-0 bg-blue-500 rounded-xl"
        transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
      />
    )}
    
    <div className="relative z-10 flex items-center gap-3">
      {tab.icon}
      <div className="text-left">
        <div className="font-semibold">{tab.label}</div>
        <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {tab.description}
        </div>
      </div>
    </div>
  </motion.button>
);

const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SecurityDashboard;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <FiShield className="w-8 h-8 text-white" />
                </div>
                Security Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive security monitoring and threat detection system
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  System Active
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <ActiveComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SecurityPage;