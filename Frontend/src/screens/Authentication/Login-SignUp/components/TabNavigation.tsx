import React from "react";
import { motion } from "framer-motion";
import type { ActiveTab } from "./types";

interface TabNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <motion.div className="flex border-b border-gray-200 mb-8">
      {(["login", "register"] as const).map((tab) => (
        <motion.button
          key={tab}
          className={`relative py-3 px-6 font-medium text-sm uppercase tracking-wider ${
            activeTab === tab
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab(tab)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tab === "login" ? "Sign In" : "Register"}
          {activeTab === tab && (
            <motion.div
              className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
              layoutId="underline"
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.6,
              }}
            />
          )}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default TabNavigation;
