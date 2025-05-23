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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setSelectedTab(tab.label)}
              className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === tab.label
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
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
