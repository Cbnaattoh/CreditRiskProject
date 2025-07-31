import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiUsers,
  FiKey,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEye,
  FiClock,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiRefreshCw,
  FiSettings,
  FiLock,
  FiUnlock,
} from "react-icons/fi";
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useGetUserRolesQuery,
} from "../../../components/redux/features/api/RBAC/rbacApi";

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  permissions: Array<{
    id: number;
    name: string;
    codename: string;
    description: string;
  }>;
  users_count?: number;
}

interface Permission {
  id: number;
  name: string;
  codename: string;
  description: string;
  content_type?: {
    app_label: string;
    model: string;
  };
}

interface UserRole {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
  };
  role: {
    id: number;
    name: string;
  };
  assigned_at: string;
  assigned_by?: {
    id: number;
    email: string;
    full_name: string;
  };
  expires_at?: string;
  is_active: boolean;
}

const RoleManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDetail, setShowRoleDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

  // API Hooks
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles, error: rolesError } = useGetRolesQuery();
  const { data: permissionsData, isLoading: permissionsLoading, error: permissionsError } = useGetPermissionsQuery();
  const { data: userRolesData, isLoading: userRolesLoading, error: userRolesError } = useGetUserRolesQuery({
    role: selectedRole?.id,
  });

  // Sample data for testing when API is not available
  const sampleRoles: Role[] = [
    {
      id: 1,
      name: "Administrator",
      description: "Full system access with all permissions",
      is_active: true,
      is_default: false,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      permissions: [
        { id: 1, name: "User Management", codename: "user_manage", description: "Manage users" },
        { id: 2, name: "Role Management", codename: "role_manage", description: "Manage roles" },
        { id: 3, name: "System Settings", codename: "system_settings", description: "Configure system" },
        { id: 4, name: "Audit Logs", codename: "audit_view", description: "View audit logs" }
      ],
      users_count: 2
    },
    {
      id: 2,
      name: "Risk Analyst",
      description: "Access to risk assessment and analysis tools",
      is_active: true,
      is_default: false,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
      permissions: [
        { id: 5, name: "Risk Assessment", codename: "risk_assess", description: "Perform risk assessments" },
        { id: 6, name: "Application Review", codename: "app_review", description: "Review applications" },
        { id: 7, name: "Report Generation", codename: "report_create", description: "Generate reports" }
      ],
      users_count: 5
    },
    {
      id: 3,
      name: "Standard User",
      description: "Basic user access to the system",
      is_active: true,
      is_default: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-20T00:00:00Z",
      permissions: [
        { id: 8, name: "Application Submit", codename: "app_submit", description: "Submit applications" },
        { id: 9, name: "Profile View", codename: "profile_view", description: "View own profile" }
      ],
      users_count: 25
    }
  ];

  const sampleUserRoles: UserRole[] = selectedRole ? [
    {
      id: 1,
      user: { id: 1, email: "admin@creditrisk.com", full_name: "System Administrator" },
      role: { id: selectedRole.id, name: selectedRole.name },
      assigned_at: "2025-01-01T00:00:00Z",
      assigned_by: { id: 1, email: "system@creditrisk.com", full_name: "System" },
      is_active: true
    },
    {
      id: 2,
      user: { id: 2, email: "manager@creditrisk.com", full_name: "Risk Manager" },
      role: { id: selectedRole.id, name: selectedRole.name },
      assigned_at: "2025-01-15T00:00:00Z",
      assigned_by: { id: 1, email: "admin@creditrisk.com", full_name: "System Administrator" },
      is_active: true
    }
  ] : [];

  // Improved data handling - prioritize API data, fallback to sample data if no API data available
  const roles = rolesData?.results && rolesData.results.length > 0 
    ? rolesData.results 
    : (rolesLoading ? [] : sampleRoles);
  const permissions = permissionsData?.results && permissionsData.results.length > 0
    ? permissionsData.results 
    : (permissionsLoading ? [] : []);
  const userRoles = userRolesData?.results && userRolesData.results.length > 0
    ? userRolesData.results 
    : (userRolesLoading ? [] : sampleUserRoles);

  console.log('🔵 RoleManagement Debug:', {
    rolesLoading,
    rolesError,
    rolesData,
    rolesCount: roles.length,
    showingSampleRoles: roles === sampleRoles,
    permissionsCount: permissions.length,
    userRolesCount: userRoles.length,
    showingSampleUserRoles: userRoles === sampleUserRoles
  });

  // Filter roles based on search and active status
  const filteredRoles = useMemo(() => {
    return roles.filter((role: Role) => {
      const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          role.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive = filterActive === undefined || role.is_active === filterActive;
      return matchesSearch && matchesActive;
    });
  }, [roles, searchQuery, filterActive]);

  // Group permissions by content type
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission: Permission) => {
      const key = permission.content_type ? 
        `${permission.content_type.app_label}.${permission.content_type.model}` : 
        'system';
      if (!groups[key]) groups[key] = [];
      groups[key].push(permission);
    });
    return groups;
  }, [permissions]);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setShowRoleDetail(true);
  };

  const handleCloseDetail = () => {
    setSelectedRole(null);
    setShowRoleDetail(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPermissionsByCategory = (permissions: Permission[]) => {
    const categories: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const category = permission.content_type?.model || 'System';
      if (!categories[category]) categories[category] = [];
      categories[category].push(permission);
    });
    return categories;
  };

  const showingSampleData = roles === sampleRoles;

  return (
    <div className="space-y-6">
      {/* Sample Data Warning Banner */}
      {showingSampleData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Demo Mode - Sample Data
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                API connection unavailable. Showing sample role data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and permissions for your organization
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FiPlus className="h-4 w-4" />
          <span>Create Role</span>
        </motion.button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterActive === undefined ? "all" : filterActive.toString()}
              onChange={(e) => setFilterActive(e.target.value === "all" ? undefined : e.target.value === "true")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
            
            <button
              onClick={() => refetchRoles()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiRefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rolesLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"
            />
          ))
        ) : filteredRoles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <FiShield className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No roles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? "Try adjusting your search criteria" : "Create your first role to get started"}
            </p>
          </div>
        ) : (
          filteredRoles.map((role: Role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleRoleClick(role)}
              className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    role.is_active 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}>
                    <FiShield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {role.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        role.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {role.is_default && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpen(actionMenuOpen === role.id ? null : role.id);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FiMoreVertical className="h-4 w-4" />
                  </button>
                  
                  <AnimatePresence>
                    {actionMenuOpen === role.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 z-50"
                      >
                        <div className="py-1">
                          <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <FiEdit className="h-4 w-4" />
                            <span>Edit Role</span>
                          </button>
                          <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            {role.is_active ? <FiLock className="h-4 w-4" /> : <FiUnlock className="h-4 w-4" />}
                            <span>{role.is_active ? 'Deactivate' : 'Activate'}</span>
                          </button>
                          <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <FiTrash2 className="h-4 w-4" />
                            <span>Delete Role</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Description */}
              {role.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {role.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {role.permissions?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Permissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {role.users_count || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <FiClock className="h-3 w-3" />
                  <span>Created {formatDate(role.created_at)}</span>
                </div>
                <motion.span
                  className="text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 4 }}
                >
                  View Details →
                </motion.span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Role Detail Modal */}
      <AnimatePresence>
        {showRoleDetail && selectedRole && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetail}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <div className="relative flex items-center justify-center min-h-screen p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl shadow-lg ${
                      selectedRole.is_active 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <FiShield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedRole.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedRole.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseDetail}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex h-[70vh]">
                  {/* Left Panel - Permissions */}
                  <div className="w-1/2 p-6 border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiKey className="h-5 w-5 mr-2" />
                      Permissions ({selectedRole.permissions?.length || 0})
                    </h3>

                    {permissionsLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(getPermissionsByCategory(selectedRole.permissions)).map(([category, perms]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {category.replace('_', ' ')}
                            </h4>
                            <div className="space-y-1">
                              {perms.map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg"
                                >
                                  <FiCheck className="h-4 w-4 text-green-500" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {permission.name}
                                    </p>
                                    {permission.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiKey className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No permissions assigned</p>
                      </div>
                    )}
                  </div>

                  {/* Right Panel - Users */}
                  <div className="w-1/2 p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiUsers className="h-5 w-5 mr-2" />
                      Users with this role ({userRoles.length})
                    </h3>

                    {userRolesLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : userRoles.length > 0 ? (
                      <div className="space-y-3">
                        {userRoles.map((userRole: UserRole) => (
                          <div
                            key={userRole.id}
                            className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <FiUsers className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userRole.user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {userRole.user.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Assigned {formatDate(userRole.assigned_at)}
                              </p>
                              {userRole.expires_at && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                  Expires {formatDate(userRole.expires_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiUsers className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No users assigned to this role</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated {formatDate(selectedRole.updated_at)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      Edit Role
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200">
                      Manage Permissions
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleManagement;