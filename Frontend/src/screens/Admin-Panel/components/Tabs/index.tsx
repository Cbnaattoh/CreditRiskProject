import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Tab {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialTab?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, initialTab }) => {
  const [selectedTab, setSelectedTab] = useState(initialTab || tabs[0].label);

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
      <div className="border-b border-gray-200/50 dark:border-gray-700/50">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <motion.button
              key={tab.label}
              whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(tab.label)}
              className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === tab.label
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              } transition-colors duration-200`}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {tabs.find((tab) => tab.label === selectedTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Tabs;
