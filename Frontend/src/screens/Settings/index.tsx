import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiShield,
  FiSettings,
  FiHome,
} from "react-icons/fi";
import { EnhancedAccountTab } from "./components/EnhancedAccountTab";
import { SecurityTab } from "./components/SecurityTab";
import { PreferencesTab } from "./components/PreferencesTab";
import SettingsDashboard from "./components/SettingsDashboard";

// Types
interface Tab {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

// Components
const Tabs: React.FC<{ tabs: Tab[]; activeTab: string; onTabChange?: (tabLabel: string) => void }> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const handleTabChange = (tabLabel: string) => {
    onTabChange?.(tabLabel);
  };

  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden transition-all duration-500">
      {/* Enhanced Tab Navigation */}
      <div className="border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <nav className="flex">
          {tabs.map((tab) => (
            <motion.button
              key={tab.label}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabChange(tab.label)}
              className={`relative flex items-center py-5 px-8 text-sm font-semibold transition-all duration-300 overflow-hidden ${
                activeTab === tab.label
                  ? "text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {/* Active tab indicator */}
              {activeTab === tab.label && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-400/10 dark:via-purple-400/10 dark:to-indigo-400/10"
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                />
              )}
              
              {/* Bottom border for active tab */}
              {activeTab === tab.label && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-full"
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                />
              )}
              
              <div className="relative z-10 flex items-center">
                {tab.icon && (
                  <span className={`mr-3 transition-colors duration-300 ${
                    activeTab === tab.label 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {tab.icon}
                  </span>
                )}
                <span className="tracking-wide">{tab.label}</span>
              </div>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Enhanced Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="p-8"
        >
          <div className="max-w-full overflow-hidden">
            {tabs.find((tab) => tab.label === activeTab)?.content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Main Component
const AccountSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current active tab from URL parameters
  const getCurrentTab = () => {
    const tabParam = searchParams.get('tab');
    switch (tabParam) {
      case 'security':
        return 'Security';
      case 'preferences':
        return 'Preferences';
      case 'account':
        return 'Account';
      default:
        return 'Dashboard';
    }
  };

  const currentTab = getCurrentTab();

  // Handle tab changes and update URL
  const handleTabChange = (tabLabel: string) => {
    const newParams = new URLSearchParams(searchParams);
    switch (tabLabel) {
      case 'Security':
        newParams.set('tab', 'security');
        break;
      case 'Preferences':
        newParams.set('tab', 'preferences');
        break;
      case 'Account':
        newParams.set('tab', 'account');
        break;
      default:
        newParams.delete('tab');
        break;
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 transition-all duration-500">
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Enhanced Header with Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Settings</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-3">
                Account Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage your account preferences and security settings
              </p>
            </div>
          </div>
        </div>

        {/* Main Settings Tabs */}
        <div className="pb-8">
          <Tabs
            tabs={[
              {
                label: "Dashboard",
                icon: <FiHome className="h-5 w-5" />,
                content: <SettingsDashboard />
              },
              {
                label: "Account",
                icon: <FiUser className="h-5 w-5" />,
                content: <EnhancedAccountTab />
              },
              {
                label: "Security", 
                icon: <FiShield className="h-5 w-5" />,
                content: <SecurityTab />
              },
              {
                label: "Preferences",
                icon: <FiSettings className="h-5 w-5" />,
                content: <PreferencesTab />
              }
            ]}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;