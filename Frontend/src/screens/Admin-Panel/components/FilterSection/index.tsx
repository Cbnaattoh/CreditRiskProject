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
    <motion.div layout className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          {isExpanded ? (
            <>
              <FiX className="mr-1" /> Hide
            </>
          ) : (
            <>
              <FiFilter className="mr-1" /> Show Filters
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative">
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
                      className="pl-8 pr-2 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FiCalendar className="absolute left-2 top-3 text-gray-400" />
                  </div>
                  <span>to</span>
                  <div className="relative">
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
                      className="pl-8 pr-2 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FiCalendar className="absolute left-2 top-3 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) =>
                    setFilters({ ...filters, eventType: e.target.value })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="all">All Events</option>
                  <option value="login">Login</option>
                  <option value="password_reset">Password Reset</option>
                  <option value="user_creation">User Creation</option>
                  <option value="permission_change">Permission Change</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterSection;
