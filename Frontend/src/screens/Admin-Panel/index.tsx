import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiPlus, FiUsers, FiActivity, FiShield } from "react-icons/fi";
import UserManagementTable from "./components/UserManagementTable";
import SystemLogsTable from "./components/SystemLogsTable";
import RoleManagement from "./components/RoleManagement";
import DebugInfo from "./components/DebugInfo";
import { usePermissions, PermissionGate } from "../../hooks/usePermissions";

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

const logs: LogEntry[] = [
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

// Main Component
const AdminPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { canManageUsers, canAssignRoles, canViewAuditLogs, isAdmin } = usePermissions();

  // Check if user has any admin permissions
  const hasAnyAdminAccess = canManageUsers || canAssignRoles || canViewAuditLogs || isAdmin;

  if (!hasAnyAdminAccess) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
              <FiShield className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Restricted
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have permission to access the admin panel. Contact your administrator if you believe this is an error.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Go Back
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and system settings
          </p>
        </div>

        <DebugInfo />

        <Tabs
          tabs={[
            // User Management Tab
            ...(canManageUsers ? [{
              label: "User Management",
              icon: <FiUsers className="h-4 w-4" />,
              content: (
                <PermissionGate permissions={["user_view_all", "user_manage"]} roles={["Admin", "Super Admin"]}>
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
                      <PermissionGate permissions={["user_create"]} roles={["Admin", "Super Admin"]}>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <FiPlus className="w-5 h-5" />
                          Add User
                        </motion.button>
                      </PermissionGate>
                    </div>
                    <UserManagementTable searchQuery={searchQuery} />
                  </div>
                </PermissionGate>
              ),
            }] : []),

            // Role Management Tab
            ...(canAssignRoles ? [{
              label: "Role Management",
              icon: <FiShield className="h-4 w-4" />,
              content: (
                <PermissionGate permissions={["role_manage", "role_assign"]} roles={["Admin", "Super Admin"]}>
                  <RoleManagement />
                </PermissionGate>
              ),
            }] : []),

            // System Logs Tab
            ...(canViewAuditLogs ? [{
              label: "System Logs",
              icon: <FiActivity className="h-4 w-4" />,
              content: (
                <PermissionGate permissions={["audit_view", "security_logs_view"]} roles={["Admin", "Super Admin"]}>
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300">
                    <SystemLogsTable logs={logs} />
                  </div>
                </PermissionGate>
              ),
            }] : []),
          ].filter(Boolean)}
          defaultActiveTab={0}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
