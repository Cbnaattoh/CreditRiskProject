import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiShield,
  FiClock,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiCheck,
  FiX,
  FiEye,
  FiUserPlus,
  FiUsers,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiSettings,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  useGetAdminUsersListQuery,
  useGetUsersFiltersQuery,
  useUpdateUserStatusMutation,
  useAdminResetPasswordMutation,
  useBulkUserActionsMutation,
} from "../../../components/redux/features/api/RBAC/rbacApi";
import RoleAssignmentModal from "./RoleAssignmentModal";
import { useToast } from "../../../components/utils/Toast";
import ApiDebugger from "../../../components/utils/ApiDebugger";

interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  user_type_display: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  active_roles: Array<{
    id: number;
    name: string;
    assigned_at: string;
    assigned_by?: string;
    expires_at?: string;
  }>;
  last_login?: string;
  date_joined: string;
  days_since_joined: number;
  days_since_last_login?: number;
  profile: {
    company?: string;
    job_title?: string;
    department?: string;
  };
}

interface UserManagementTableProps {
  searchQuery: string;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({ searchQuery }) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<"single" | "bulk">("single");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    user_type: "",
    status: "",
    role: "",
    is_active: undefined as boolean | undefined,
    has_mfa: undefined as boolean | undefined,
  });
  const [sortBy, setSortBy] = useState("date_joined");
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const { success, error: showErrorToast } = useToast();

  // API Hooks
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useGetAdminUsersListQuery({
    search: searchQuery,
    page: currentPage,
    page_size: 20,
    sort_by: sortBy,
    ...filters,
  });

  const { data: filtersData } = useGetUsersFiltersQuery();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [adminResetPassword] = useAdminResetPasswordMutation();
  const [bulkUserActions] = useBulkUserActionsMutation();

  // Sample data for testing when API is not available
  const sampleUsers: User[] = [
    {
      id: 1,
      email: "admin@creditrisk.com",
      full_name: "System Administrator",
      user_type: "admin",
      user_type_display: "Administrator",
      status: "active",
      is_active: true,
      is_verified: true,
      mfa_enabled: true,
      active_roles: [
        { id: 1, name: "Administrator", assigned_at: "2025-01-01T00:00:00Z" }
      ],
      last_login: "2025-01-31T10:00:00Z",
      date_joined: "2025-01-01T00:00:00Z",
      days_since_joined: 30,
      days_since_last_login: 0,
      profile: {
        company: "Credit Risk Corp",
        job_title: "System Administrator",
        department: "IT"
      }
    },
    {
      id: 2,
      email: "analyst@creditrisk.com",
      full_name: "Risk Analyst",
      user_type: "analyst",
      user_type_display: "Risk Analyst",
      status: "active",
      is_active: true,
      is_verified: true,
      mfa_enabled: false,
      active_roles: [
        { id: 2, name: "Risk Analyst", assigned_at: "2025-01-15T00:00:00Z" }
      ],
      last_login: "2025-01-30T15:30:00Z",
      date_joined: "2025-01-15T00:00:00Z",
      days_since_joined: 16,
      days_since_last_login: 1,
      profile: {
        company: "Credit Risk Corp",
        job_title: "Senior Risk Analyst",
        department: "Risk Management"
      }
    },
    {
      id: 3,
      email: "user@creditrisk.com",
      full_name: "Standard User",
      user_type: "user",
      user_type_display: "Standard User",
      status: "inactive",
      is_active: false,
      is_verified: true,
      mfa_enabled: false,
      active_roles: [
        { id: 3, name: "Standard User", assigned_at: "2025-01-20T00:00:00Z" }
      ],
      last_login: "2025-01-25T09:15:00Z",
      date_joined: "2025-01-20T00:00:00Z",
      days_since_joined: 11,
      days_since_last_login: 6,
      profile: {
        company: "Client Corp",
        job_title: "Business Analyst",
        department: "Finance"
      }
    }
  ];

  // Improved data handling - prioritize API data, fallback to sample data if no API data available
  const users = usersData?.results && usersData.results.length > 0 
    ? usersData.results 
    : (isLoading ? [] : sampleUsers);
  const totalUsers = usersData?.count || (isLoading ? 0 : sampleUsers.length);
  const totalPages = Math.ceil(totalUsers / 20);

  console.log('🔵 UserManagementTable Debug:', {
    isLoading,
    error,
    usersData,
    usersCount: users.length,
    showingSampleData: users === sampleUsers
  });

  // Selection handlers
  const handleSelectUser = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users);
    }
  };

  // Role assignment handlers
  const handleAssignRole = (user?: User) => {
    if (user) {
      setSelectedUsers([user]);
      setRoleModalMode("single");
    } else {
      setRoleModalMode("bulk");
    }
    setShowRoleModal(true);
  };

  // User actions
  const handleUserAction = async (userId: number, action: "activate" | "deactivate") => {
    try {
      await updateUserStatus({ userId, action }).unwrap();
      const user = users.find(u => u.id === userId);
      const userName = user?.full_name || user?.email || "User";
      success(`Successfully ${action}d ${userName}`);
    } catch (err: any) {
      console.error("User action failed:", err);
      showErrorToast(`Failed to ${action} user. Please try again.`);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await adminResetPassword({ userId }).unwrap();
      const user = users.find(u => u.id === userId);
      const userName = user?.full_name || user?.email || "User";
      success(`Password reset email sent to ${userName}`);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      showErrorToast("Failed to reset password. Please try again.");
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete" | "reset_password") => {
    if (selectedUsers.length === 0) return;
    
    try {
      await bulkUserActions({
        user_ids: selectedUsers.map(u => u.id),
        action,
      }).unwrap();
      
      const verb = action === "reset_password" ? "Password reset" : action;
      const actionText = action === "reset_password" ? "Password reset emails sent" : 
                        action === "activate" ? "Activated" :
                        action === "deactivate" ? "Deactivated" : "Deleted";
      success(`${actionText} ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`);
      setSelectedUsers([]);
    } catch (err: any) {
      console.error("Bulk action failed:", err);
      showErrorToast(`Failed to ${action} users. Please try again.`);
    }
  };

  const getStatusColor = (user: User) => {
    if (!user.is_active) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    if (!user.is_verified) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
  };

  const getStatusText = (user: User) => {
    if (!user.is_active) return "Inactive";
    if (!user.is_verified) return "Unverified";
    return "Active";
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Only show error state if there's an actual error AND no fallback data
  if (error && users.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <FiAlertTriangle className="mx-auto text-6xl text-orange-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          API Connection Issue
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unable to load user data from server. Showing sample data for demonstration.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Error: {(error as any)?.data?.detail || (error as any)?.message || 'Unknown error'}
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" />
          <span>Retry API Connection</span>
        </button>
      </div>
    );
  }

  const showingSampleData = users === sampleUsers;

  return (
    <>
      <ApiDebugger 
        queryName="AdminUsersListQuery"
        data={usersData}
        isLoading={isLoading}
        error={error}
        showDetails={true}
      />
      {/* Sample Data Warning Banner */}
      {showingSampleData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Demo Mode - Sample Data
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                API connection unavailable. Showing sample user data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FiUsers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-indigo-900 dark:text-indigo-100">
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                  >
                    Clear selection
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAssignRole()}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <FiShield className="h-4 w-4" />
                    <span>Assign Role</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("activate")}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <FiCheck className="h-4 w-4" />
                    <span>Activate</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("deactivate")}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Deactivate</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Table */}
        <div className="bg-transparent rounded-2xl overflow-hidden">
          {/* Enhanced Table Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-800/80 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-indigo-600 bg-white/90 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Select All
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({users.length} users)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    showFilters
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <FiFilter className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </button>
                <button
                  onClick={() => refetch()}
                  className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:text-gray-800 dark:hover:text-gray-200 rounded-xl transition-all duration-200"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <select
                    value={filters.user_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">All User Types</option>
                    {filtersData?.user_types?.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.display}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">All Statuses</option>
                    {filtersData?.status_options?.map((status) => (
                      <option key={status.code} value={status.code}>
                        {status.display}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">All Roles</option>
                    {filtersData?.roles?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.is_active === undefined ? "" : filters.is_active.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      is_active: e.target.value === "" ? undefined : e.target.value === "true"
                    }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Active Status</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="date_joined">Sort by Join Date</option>
                    <option value="last_login">Sort by Last Login</option>
                    <option value="full_name">Sort by Name</option>
                    <option value="email">Sort by Email</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100/80 via-blue-50/60 to-gray-100/80 dark:from-gray-700/80 dark:via-gray-700/60 dark:to-gray-700/80 backdrop-blur-sm">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    User Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status & Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Assigned Roles
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Member Since
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30 bg-white/30 dark:bg-gray-800/30">
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-200 group"
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.some(u => u.id === user.id)}
                          onChange={() => handleSelectUser(user)}
                          className="w-5 h-5 text-indigo-600 bg-white/90 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200 group-hover:scale-110"
                        />
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                <FiUser className="h-6 w-6 text-white" />
                              </div>
                              {user.mfa_enabled && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                  <FiShield className="h-2 w-2 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {user.full_name}
                              </div>
                              {user.is_verified && (
                                <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                  <FiCheck className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
                              <FiMail className="h-3 w-3 mr-1.5 text-gray-400" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.profile.job_title && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                {user.profile.job_title} • {user.profile.department || 'No Department'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 ${getStatusColor(user)}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                              user.is_active && user.is_verified 
                                ? 'bg-green-500 animate-pulse' 
                                : user.is_active 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}></div>
                            {getStatusText(user)}
                          </span>
                          {user.mfa_enabled && (
                            <div className="relative group">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 font-medium border border-green-200/50 dark:border-green-800/50 shadow-sm">
                                <FiShield className="w-3 h-3 mr-1" />
                                MFA
                              </span>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                                  Multi-Factor Authentication Enabled
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">
                              {user.user_type_display}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {user.active_roles.length === 0 ? (
                          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">No roles assigned</span>
                          </div>
                        ) : (
                          <>
                            {user.active_roles.slice(0, 2).map((role, index) => (
                              <div
                                key={role.id}
                                className="relative group"
                              >
                                <span className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold shadow-sm border transition-all duration-200 hover:scale-105 ${
                                  index === 0 
                                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-200/50 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-400 dark:border-indigo-800/50'
                                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200/50 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 dark:border-blue-800/50'
                                }`}>
                                  <FiShield className="w-3 h-3 mr-1.5" />
                                  {role.name}
                                </span>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    <div className="font-medium">{role.name}</div>
                                    <div className="text-gray-300 dark:text-gray-400">
                                      Assigned: {new Date(role.assigned_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {user.active_roles.length > 2 && (
                              <div className="relative group">
                                <span className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50 dark:from-gray-800/50 dark:to-slate-800/50 dark:text-gray-300 dark:border-gray-700/50 shadow-sm hover:scale-105 transition-all duration-200">
                                  <FiUsers className="w-3 h-3 mr-1" />
                                  +{user.active_roles.length - 2} more
                                </span>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    <div className="font-medium">Additional Roles:</div>
                                    {user.active_roles.slice(2).map((role) => (
                                      <div key={role.id} className="text-gray-300 dark:text-gray-400">
                                        • {role.name}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 group">
                          <div className={`p-1.5 rounded-lg transition-all duration-200 group-hover:scale-110 ${
                            user.last_login && user.days_since_last_login !== undefined && user.days_since_last_login <= 1
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : user.last_login && user.days_since_last_login !== undefined && user.days_since_last_login <= 7
                              ? 'bg-yellow-100 dark:bg-yellow-900/30'
                              : 'bg-gray-100 dark:bg-gray-800/50'
                          }`}>
                            <FiClock className={`h-3.5 w-3.5 ${
                              user.last_login && user.days_since_last_login !== undefined && user.days_since_last_login <= 1
                                ? 'text-green-600 dark:text-green-400'
                                : user.last_login && user.days_since_last_login !== undefined && user.days_since_last_login <= 7
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatLastLogin(user.last_login)}
                            </div>
                            {user.last_login && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(user.last_login).toLocaleDateString()} at {new Date(user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 group">
                          <div className="p-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg transition-all duration-200 group-hover:scale-110">
                            <FiUserPlus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(user.date_joined).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.days_since_joined} days ago
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-3">
                        {/* Quick Action Buttons */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => handleAssignRole(user)}
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all duration-200 hover:scale-110 group/btn"
                            title="Assign Role"
                          >
                            <FiShield className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, user.is_active ? "deactivate" : "activate")}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 group/btn ${
                              user.is_active 
                                ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30' 
                                : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                            }`}
                            title={user.is_active ? "Deactivate User" : "Activate User"}
                          >
                            {user.is_active ? (
                              <FiX className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                            ) : (
                              <FiCheck className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                            )}
                          </button>
                        </div>
                        
                        {/* More Actions Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                            className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                          >
                            <FiMoreVertical className="h-4 w-4" />
                          </button>
                        
                          <AnimatePresence>
                            {actionMenuOpen === user.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden"
                              >
                                <div className="py-2">
                                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700/50">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      User Actions
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      handleAssignRole(user);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200 group"
                                  >
                                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                      <FiShield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium">Assign Role</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Manage user permissions</div>
                                    </div>
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      handleUserAction(user.id, user.is_active ? "deactivate" : "activate");
                                      setActionMenuOpen(null);
                                    }}
                                    className={`flex items-center space-x-3 w-full px-4 py-3 text-left text-sm transition-all duration-200 group ${
                                      user.is_active 
                                        ? 'text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30' 
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                                    }`}
                                  >
                                    <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-200 ${
                                      user.is_active 
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                                        : 'bg-green-100 dark:bg-green-900/30'
                                    }`}>
                                      {user.is_active ? (
                                        <FiX className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                                      ) : (
                                        <FiCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium">{user.is_active ? "Deactivate" : "Activate"}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.is_active ? "Suspend user access" : "Restore user access"}
                                      </div>
                                    </div>
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      handleResetPassword(user.id);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all duration-200 group"
                                  >
                                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                      <FiSettings className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium">Reset Password</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Send reset email</div>
                                    </div>
                                  </button>
                                  
                                  <div className="border-t border-gray-100 dark:border-gray-700/50 mt-2 pt-2">
                                    <button
                                      onClick={() => setActionMenuOpen(null)}
                                      className="flex items-center justify-center w-full px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                                    >
                                      <FiEye className="h-3 w-3 mr-1" />
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        selectedUsers={selectedUsers}
        mode={roleModalMode}
        onSuccess={() => {
          refetch();
          setSelectedUsers([]);
        }}
      />
    </>
  );
};

export default UserManagementTable;