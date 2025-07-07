import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiFilter, FiX, FiSearch, FiPlus } from "react-icons/fi";
import UserManagementTable from "./components/UserManagementTable";
import SystemLogsTable from "./components/SystemLogsTable";

// Types
interface User {
  id: string;
  profile: string;
  name: string;
  role: string;
  status: "Active" | "Inactive" | "Suspended";
  lastLogin: string;
  joinDate: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  performedBy: string;
  ipAddress: string;
  status: "Success" | "Failed" | "Warning";
  details: string;
}

interface Tab {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface Filters {
  dateRange: { start: string; end: string };
  eventType: string;
  status: string;
}

// Sample Data
const users: User[] = [
  {
    id: "1",
    profile: "jd@gmail.com",
    name: "John Doe",
    role: "Auditor",
    status: "Active",
    lastLogin: "2 hours ago",
    joinDate: "2025-01-15",
  },
  {
    id: "2",
    profile: "loanofficer@gmail.com",
    name: "Jane Smith",
    role: "Loan Officer",
    status: "Suspended",
    lastLogin: "30 minutes ago",
    joinDate: "2025-02-20",
  },
  {
    id: "3",
    profile: "loanofficer@gmail.com",
    name: "Jane Biggle",
    role: "Standard User",
    status: "Inactive",
    lastLogin: "30 minutes ago",
    joinDate: "2025-02-20",
  },
];

const initialLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2025-05-14 10:42 AM",
    event: "User Login",
    performedBy: "John@gmail.com",
    ipAddress: "192.168.0.1",
    status: "Success",
    details: "User logged in successfully",
  },
  {
    id: "2",
    timestamp: "2025-05-14 10:42 PM",
    event: "Password Reset",
    performedBy: "John@gmail.com",
    ipAddress: "192.168.0.1",
    status: "Failed",
    details: "Failed password attempt",
  },
];

// Components
const Tabs: React.FC<{ tabs: Tab[]; defaultActiveTab?: number }> = ({
  tabs,
  defaultActiveTab = 0,
}) => {
  const [selectedTab, setSelectedTab] = useState(tabs[defaultActiveTab].label);

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
      <div className="border-b border-gray-200/50 dark:border-gray-700/50">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <motion.button
              key={tab.label}
              whileHover={{ backgroundColor: "rgba(79, 70, 229, 0.05)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(tab.label)}
              className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                selectedTab === tab.label
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
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
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="p-6"
        >
          {tabs.find((tab) => tab.label === selectedTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const FilterSection: React.FC<{ onFilter: (filters: Filters) => void }> = ({
  onFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Filters>({
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

// Main Component
const AdminPanel: React.FC = () => {
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilter = (filters: Filters) => {
    const filtered = initialLogs.filter((log) => {
      if (filters.dateRange.start && filters.dateRange.end) {
        const logDate = new Date(log.timestamp).getTime();
        const startDate = new Date(filters.dateRange.start).getTime();
        const endDate = new Date(filters.dateRange.end).getTime();
        if (logDate < startDate || logDate > endDate) return false;
      }

      if (filters.eventType !== "all" && log.event !== filters.eventType) {
        return false;
      }

      if (filters.status !== "all" && log.status !== filters.status) {
        return false;
      }

      return true;
    });

    setFilteredLogs(filtered);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 p-6 overflow-auto">
        <Tabs
          tabs={[
            {
              label: "User Management",
              content: (
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="w-full md:w-1/2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name, email or role..."
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FiPlus className="w-5 h-5" />
                      Add User
                    </motion.button>
                  </div>
                  <UserManagementTable users={users} />
                </div>
              ),
            },
            {
              label: "System Logs",
              content: (
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300">
                  <FilterSection onFilter={handleFilter} />
                  <div className="mt-6">
                    <SystemLogsTable logs={filteredLogs} />
                  </div>
                </div>
              ),
            },
          ]}
          defaultActiveTab={0}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
