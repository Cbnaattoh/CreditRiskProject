import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowThemeOptions(false);
      }
    };

    if (showThemeOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showThemeOptions]);

  const getThemeIcon = () => {
    return resolvedTheme === "dark" ? (
      <FiMoon className="text-indigo-600 dark:text-indigo-400" size={20} />
    ) : (
      <FiSun className="text-amber-600 dark:text-amber-400" size={20} />
    );
  };

  return (
    <div ref={containerRef}>
      <motion.button
        className="fixed bottom-6 right-6 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={() => setShowThemeOptions(!showThemeOptions)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {getThemeIcon()}
      </motion.button>

      <AnimatePresence>
        {showThemeOptions && (
          <motion.div
            className="fixed bottom-20 right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.2 }}
          >
            <div className="p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Theme Settings
              </h4>
              <div className="flex flex-col space-y-2">
                <motion.button
                  onClick={() => {
                    setTheme("light");
                    setShowThemeOptions(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-left flex items-center transition-colors ${
                    theme === "light"
                      ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiSun className="mr-2" /> Light Mode
                </motion.button>
                <motion.button
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeOptions(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-left flex items-center transition-colors ${
                    theme === "dark"
                      ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiMoon className="mr-2" /> Dark Mode
                </motion.button>
                <motion.button
                  onClick={() => {
                    setTheme("system");
                    setShowThemeOptions(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-left flex items-center transition-colors ${
                    theme === "system"
                      ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiMonitor className="mr-2" /> System Preference
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
