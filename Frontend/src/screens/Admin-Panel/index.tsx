import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiPlus,
  FiUsers,
  FiActivity,
  FiShield,
} from "react-icons/fi";
import UserManagementTable from "./components/UserManagementTable";
import SystemLogsTable from "./components/SystemLogsTable";
import RoleManagement from "./components/RoleManagement";
import DebugInfo from "./components/DebugInfo";
import AdminUserCreation from "./components/AdminUserCreation";
import { usePermissions, useIsAdmin, useCanAccessAdmin, useHasAnyPermission } from "../../components/utils/hooks/useRBAC";
import { ProtectedComponent, AdminOnly } from "../../components/redux/features/api/RBAC/ProtectedComponent";
import ComprehensiveDebug from "../../components/utils/ComprehensiveDebug";
import ErrorBoundary from "../../components/utils/ErrorBoundary";

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
const AdminPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserCreationModalOpen, setIsUserCreationModalOpen] = useState(false);
  const { permissions, roles, isAdmin } = usePermissions();
  const canAccessAdmin = useCanAccessAdmin();
  const canManageUsers = useHasAnyPermission(["user_view_all", "user_edit_all"]);
  const canAssignRoles = useHasAnyPermission(["role_view", "user_manage_roles"]);
  const canViewAuditLogs = useHasAnyPermission(["view_audit_logs", "security_logs_view"]);


  // Get current active tab from URL parameters
  const getCurrentTab = () => {
    const tabParam = searchParams.get('tab');
    switch (tabParam) {
      case 'roles':
        return 'Role Management';
      case 'logs':
        return 'System Logs';
      default:
        return 'User Management';
    }
  };

  const currentTab = getCurrentTab();

  // Handle tab changes and update URL
  const handleTabChange = (tabLabel: string) => {
    const newParams = new URLSearchParams(searchParams);
    switch (tabLabel) {
      case 'Role Management':
        newParams.set('tab', 'roles');
        break;
      case 'System Logs':
        newParams.set('tab', 'logs');
        break;
      default:
        newParams.delete('tab');
        break;
    }
    setSearchParams(newParams);
  };

  // Check if user has any admin permissions
  const hasAnyAdminAccess =
    canManageUsers || canAssignRoles || canViewAuditLogs || isAdmin;

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
              You don't have permission to access the admin panel. Contact your
              administrator if you believe this is an error.
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 transition-all duration-500">
      <ErrorBoundary>
        <ComprehensiveDebug />
      </ErrorBoundary>
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Enhanced Header with Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Admin Panel</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-3">
                Admin Control Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Comprehensive system administration and user management
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <FiActivity className="h-4 w-4" />
                <span>System Health</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FiPlus className="h-4 w-4" />
                <span>Quick Add</span>
              </motion.button>
            </div>
          </div>
          
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">1,247</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">+12% this month</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">342</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Live now</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <FiActivity className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Roles</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">8</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">4 custom roles</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                  <FiShield className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Alerts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">3</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Requires attention</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                  <FiSearch className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* <DebugInfo /> */}

        {/* Main Admin Tabs */}
        <div className="pb-8">
          <Tabs
            tabs={[
              // User Management Tab
              ...(canManageUsers
                ? [
                    {
                      label: "User Management",
                      icon: <FiUsers className="h-5 w-5" />,
                    content: (
                      <ProtectedComponent
                        permissions={["user_view_all", "user_manage"]}
                        roles={["Administrator", "Manager"]}
                        requireAll={false}
                      >
                        <div className="space-y-6">
                          {/* Enhanced Search and Actions Header */}
                          <div className="bg-gradient-to-r from-white/80 via-blue-50/50 to-indigo-50/80 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6 transition-all duration-300">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                              <div className="flex-1 max-w-md">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Search Users
                                </label>
                                <div className="relative group">
                                  <input
                                    type="text"
                                    placeholder="Search by name, email, or role..."
                                    className="w-full pl-12 pr-4 py-3 bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 focus:border-indigo-500/50 dark:focus:border-indigo-400/50 text-gray-900 dark:text-white transition-all duration-300 shadow-sm group-hover:shadow-md font-medium backdrop-blur-sm placeholder-gray-500 dark:placeholder-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                  />
                                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <FiSearch className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <ProtectedComponent
                                  permissions={["role_create"]}
                                  roles={["Administrator", "Manager"]}
                                >
                                  <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsUserCreationModalOpen(true)}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                  >
                                    <FiPlus className="w-5 h-5" />
                                    <span>Add New User</span>
                                  </motion.button>
                                </ProtectedComponent>
                                
                                <motion.button
                                  whileHover={{ scale: 1.02, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center space-x-2 px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                                >
                                  <FiUsers className="w-5 h-5" />
                                  <span>Bulk Actions</span>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                          
                          {/* User Management Table Container */}
                          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                            <UserManagementTable searchQuery={searchQuery} />
                          </div>
                        </div>
                      </ProtectedComponent>
                    ),
                  },
                ]
              : []),

            // Role Management Tab
            ...(canAssignRoles
              ? [
                  {
                    label: "Role Management",
                    icon: <FiShield className="h-5 w-5" />,
                    content: (
                      <ProtectedComponent
                        permissions={["role_assign"]}
                        roles={["Administrator", "Manager"]}
                        requireAll={false}
                      >
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                          <RoleManagement />
                        </div>
                      </ProtectedComponent>
                    ),
                  },
                ]
              : []),

            // System Logs Tab
            ...(canViewAuditLogs
              ? [
                  {
                    label: "System Logs",
                    icon: <FiActivity className="h-5 w-5" />,
                    content: (
                      <ProtectedComponent
                        permissions={["system_logs"]}
                        roles={["Administrator", "Manager"]}
                        requireAll={false}
                      >
                        <div className="space-y-6">
                          {/* System Logs Header */}
                          <div className="bg-gradient-to-r from-white/80 via-amber-50/50 to-orange-50/80 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                  System Activity Logs
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                  Monitor system events, user activities, and security incidents
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Live</span>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                                >
                                  Export Logs
                                </motion.button>
                              </div>
                            </div>
                          </div>
                          
                          {/* System Logs Table Container */}
                          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                            <div className="p-6">
                              <SystemLogsTable logs={logs} />
                            </div>
                          </div>
                        </div>
                      </ProtectedComponent>
                    ),
                  },
                ]
              : []),
            ].filter(Boolean)}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {/* Admin User Creation Modal */}
      <AdminUserCreation
        isOpen={isUserCreationModalOpen}
        onClose={() => setIsUserCreationModalOpen(false)}
        onUserCreated={(userData) => {
          // Optionally refresh user list or show success message
          setIsUserCreationModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminPanel;
