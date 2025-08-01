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

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  searchQuery,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<"single" | "bulk">(
    "single"
  );
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
        { id: 1, name: "Administrator", assigned_at: "2025-01-01T00:00:00Z" },
      ],
      last_login: "2025-01-31T10:00:00Z",
      date_joined: "2025-01-01T00:00:00Z",
      days_since_joined: 30,
      days_since_last_login: 0,
      profile: {
        company: "Credit Risk Corp",
        job_title: "System Administrator",
        department: "IT",
      },
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
        { id: 2, name: "Risk Analyst", assigned_at: "2025-01-15T00:00:00Z" },
      ],
      last_login: "2025-01-30T15:30:00Z",
      date_joined: "2025-01-15T00:00:00Z",
      days_since_joined: 16,
      days_since_last_login: 1,
      profile: {
        company: "Credit Risk Corp",
        job_title: "Senior Risk Analyst",
        department: "Risk Management",
      },
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
        { id: 3, name: "Standard User", assigned_at: "2025-01-20T00:00:00Z" },
      ],
      last_login: "2025-01-25T09:15:00Z",
      date_joined: "2025-01-20T00:00:00Z",
      days_since_joined: 11,
      days_since_last_login: 6,
      profile: {
        company: "Client Corp",
        job_title: "Business Analyst",
        department: "Finance",
      },
    },
  ];

  const users = usersData?.results || (error ? sampleUsers : []);
  const totalUsers = usersData?.count || (error ? sampleUsers.length : 0);
  const totalPages = Math.ceil(totalUsers / 20);

  // Selection handlers
  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
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
  const handleUserAction = async (
    userId: number,
    action: "activate" | "deactivate"
  ) => {
    try {
      await updateUserStatus({ userId, action }).unwrap();
      const user = users.find((u) => u.id === userId);
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
      const user = users.find((u) => u.id === userId);
      const userName = user?.full_name || user?.email || "User";
      success(`Password reset email sent to ${userName}`);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      showErrorToast("Failed to reset password. Please try again.");
    }
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete" | "reset_password"
  ) => {
    if (selectedUsers.length === 0) return;

    try {
      await bulkUserActions({
        user_ids: selectedUsers.map((u) => u.id),
        action,
      }).unwrap();

      const verb = action === "reset_password" ? "Password reset" : action;
      const actionText =
        action === "reset_password"
          ? "Password reset emails sent"
          : action === "activate"
          ? "Activated"
          : action === "deactivate"
          ? "Deactivated"
          : "Deleted";
      success(
        `${actionText} ${selectedUsers.length} user${
          selectedUsers.length !== 1 ? "s" : ""
        }`
      );
      setSelectedUsers([]);
    } catch (err: any) {
      console.error("Bulk action failed:", err);
      showErrorToast(`Failed to ${action} users. Please try again.`);
    }
  };

  const getStatusColor = (user: User) => {
    if (!user.is_active)
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    if (!user.is_verified)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
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

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertTriangle className="mx-auto text-6xl text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load users
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          There was an error loading the user data.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <>
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
                      {selectedUsers.length} user
                      {selectedUsers.length !== 1 ? "s" : ""} selected
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

        {/* Table */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={
                    selectedUsers.length === users.length && users.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Select All ({users.length})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showFilters
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <FiFilter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                <button
                  onClick={() => refetch()}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        user_type: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, role: e.target.value }))
                    }
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
                    value={
                      filters.is_active === undefined
                        ? ""
                        : filters.is_active.toString()
                    }
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        is_active:
                          e.target.value === ""
                            ? undefined
                            : e.target.value === "true",
                      }))
                    }
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
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.some((u) => u.id === user.id)}
                          onChange={() => handleSelectUser(user)}
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <FiMail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            {user.profile.job_title && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {user.profile.job_title}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            user
                          )}`}
                        >
                          {getStatusText(user)}
                        </span>
                        <div className="flex items-center space-x-2">
                          {user.mfa_enabled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              MFA
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {user.user_type_display}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.active_roles.length === 0 ? (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            No roles
                          </span>
                        ) : (
                          user.active_roles.slice(0, 2).map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
                            >
                              {role.name}
                            </span>
                          ))
                        )}
                        {user.active_roles.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            +{user.active_roles.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FiClock className="h-3 w-3" />
                        <span>{formatLastLogin(user.last_login)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === user.id ? null : user.id
                            )
                          }
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <FiMoreVertical className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {actionMenuOpen === user.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 z-50"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleAssignRole(user);
                                    setActionMenuOpen(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <FiShield className="h-4 w-4" />
                                  <span>Assign Role</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleUserAction(
                                      user.id,
                                      user.is_active ? "deactivate" : "activate"
                                    );
                                    setActionMenuOpen(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {user.is_active ? (
                                    <FiX className="h-4 w-4" />
                                  ) : (
                                    <FiCheck className="h-4 w-4" />
                                  )}
                                  <span>
                                    {user.is_active ? "Deactivate" : "Activate"}
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleResetPassword(user.id);
                                    setActionMenuOpen(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <FiSettings className="h-4 w-4" />
                                  <span>Reset Password</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                  Showing {(currentPage - 1) * 20 + 1} to{" "}
                  {Math.min(currentPage * 20, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
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
