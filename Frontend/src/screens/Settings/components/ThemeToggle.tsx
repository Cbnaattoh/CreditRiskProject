import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [showThemeOptions, setShowThemeOptions] = useState(false);

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={() => setShowThemeOptions(!showThemeOptions)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {theme === "dark" ? (
          <FiMoon className="text-indigo-600 dark:text-indigo-400" size={20} />
        ) : (
          <FiSun className="text-amber-600 dark:text-amber-400" size={20} />
        )}
      </motion.button>

      <AnimatePresence>
        {showThemeOptions && (
          <motion.div
            className="fixed bottom-20 right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Theme Settings
              </h4>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-4 py-2 rounded-lg text-left flex items-center ${
                    theme === "light"
                      ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <FiSun className="mr-2" /> Light Mode
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-4 py-2 rounded-lg text-left flex items-center ${
                    theme === "dark"
                      ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <FiMoon className="mr-2" /> Dark Mode
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`px-4 py-2 rounded-lg text-left flex items-center ${
                    theme === "system"
                      ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <FiMonitor className="mr-2" /> System Preference
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
