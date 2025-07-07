import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiFilter, FiX } from "react-icons/fi";

const FilterSection: React.FC<{
  onFilter: (filters: {
    dateRange: { start: string; end: string };
    eventType: string;
    status: string;
  }) => void;
}> = ({ onFilter }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    eventType: "all",
    status: "all",
  });

  const handleApplyFilters = () => {
    onFilter(filters);
    setIsExpanded(false);
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: { start: "", end: "" },
      eventType: "all",
      status: "all",
    });
    onFilter({
      dateRange: { start: "", end: "" },
      eventType: "all",
      status: "all",
    });
  };

  return (
    <motion.div
      layout
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6 transition-all duration-300"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200"
        >
          {isExpanded ? (
            <>
              <FiX className="h-4 w-4" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <FiFilter className="h-4 w-4" />
              <span>Show Filters</span>
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: {
                            ...filters.dateRange,
                            start: e.target.value,
                          },
                        })
                      }
                      className="pl-9 pr-3 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                    />
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    to
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: {
                            ...filters.dateRange,
                            end: e.target.value,
                          },
                        })
                      }
                      className="pl-9 pr-3 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                    />
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) =>
                    setFilters({ ...filters, eventType: e.target.value })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                >
                  <option value="all">All Events</option>
                  <option value="login">Login</option>
                  <option value="password_reset">Password Reset</option>
                  <option value="user_creation">User Creation</option>
                  <option value="permission_change">Permission Change</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 shadow-sm"
              >
                Reset
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.03,
                  boxShadow:
                    "0 4px 6px -1px rgba(79, 70, 229, 0.3), 0 2px 4px -1px rgba(79, 70, 229, 0.2)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={handleApplyFilters}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterSection;
