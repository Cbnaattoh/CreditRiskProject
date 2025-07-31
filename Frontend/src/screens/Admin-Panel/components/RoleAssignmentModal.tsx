import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import {
  FiX,
  FiUsers,
  FiShield,
  FiClock,
  FiCheck,
  FiSearch,
  FiAlertCircle,
  FiUser,
  FiMail,
  FiCalendar,
  FiUserCheck,
} from "react-icons/fi";
import {
  useAssignUserRoleMutation,
  useBulkAssignRolesMutation,
  useGetRolesQuery,
  useGetAdminUsersListQuery,
} from "../../../components/redux/features/api/RBAC/rbacApi";
import { useToast } from "../../../components/utils/Toast";

interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  status: string;
  is_active: boolean;
  active_roles: Array<{
    id: number;
    name: string;
    assigned_at: string;
    expires_at?: string;
  }>;
  profile: {
    company?: string;
    job_title?: string;
    department?: string;
  };
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Array<{
    id: number;
    name: string;
    codename: string;
  }>;
}

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers?: User[];
  mode: "single" | "bulk";
  onSuccess?: () => void;
}

interface FormData {
  role_id: number;
  expires_at?: string;
  notes?: string;
}

const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedUsers = [],
  mode,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>();

  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useGetRolesQuery();
  const { data: usersData, isLoading: usersLoading } = useGetAdminUsersListQuery({
    search: searchQuery,
    page_size: 50,
  });

  // Sample roles for testing when API is not available
  const sampleRoles = {
    results: [
      {
        id: 1,
        name: "Administrator",
        description: "Full system access with all permissions",
        is_active: true,
        permissions: [
          { id: 1, name: "User Management", codename: "user_manage" },
          { id: 2, name: "Role Management", codename: "role_manage" },
          { id: 3, name: "System Settings", codename: "system_settings" }
        ]
      },
      {
        id: 2,
        name: "Risk Analyst",
        description: "Access to risk assessment and analysis tools",
        is_active: true,
        permissions: [
          { id: 4, name: "Risk Assessment", codename: "risk_assess" },
          { id: 5, name: "Application Review", codename: "app_review" }
        ]
      },
      {
        id: 3,
        name: "Standard User",
        description: "Basic user access to the system",
        is_active: true,
        permissions: [
          { id: 6, name: "Application Submit", codename: "app_submit" },
          { id: 7, name: "Profile View", codename: "profile_view" }
        ]
      }
    ]
  };

  const effectiveRolesData = rolesData || (rolesError ? sampleRoles : null);

  const [assignUserRole] = useAssignUserRoleMutation();
  const [bulkAssignRoles] = useBulkAssignRolesMutation();

  const watchedRoleId = watch("role_id");

  // Find selected role details
  const selectedRoleDetails = useMemo(() => {
    if (!effectiveRolesData?.results || !watchedRoleId) return null;
    return effectiveRolesData.results.find((role: Role) => role.id === watchedRoleId) || null;
  }, [effectiveRolesData, watchedRoleId]);

  // Filter available users for selection
  const availableUsers = useMemo(() => {
    if (!usersData?.results) return [];
    return usersData.results.filter((user: User) => 
      user.is_active && 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersData, searchQuery]);

  const handleFormSubmit = async (data: FormData) => {
    if (!data.role_id) return;
    
    setIsSubmitting(true);
    try {
      let result;
      let successMessage = "";

      if (mode === "bulk" && selectedUsers.length > 0) {
        result = await bulkAssignRoles({
          user_ids: selectedUsers.map(user => user.id),
          role_id: data.role_id,
          expires_at: data.expires_at || undefined,
        }).unwrap();
        
        const roleName = effectiveRolesData?.results?.find((r: Role) => r.id === data.role_id)?.name || "role";
        successMessage = `Successfully assigned ${roleName} to ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`;
      } else if (mode === "single" && selectedUsers.length === 1) {
        result = await assignUserRole({
          userId: selectedUsers[0].id,
          role_id: data.role_id,
          expires_at: data.expires_at || undefined,
        }).unwrap();
        
        const roleName = effectiveRolesData?.results?.find((r: Role) => r.id === data.role_id)?.name || "role";
        const userName = selectedUsers[0].full_name || selectedUsers[0].email;
        successMessage = `Successfully assigned ${roleName} to ${userName}`;
      }

      success(successMessage);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error("Role assignment failed:", err);
      
      let errorMessage = "Failed to assign role. Please try again.";
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRole(null);
    setSearchQuery("");
    onClose();
  };

  const getUserRoleStatus = (user: User, roleId: number) => {
    return user.active_roles.some(role => role.id === roleId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
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
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <FiShield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mode === "bulk" ? "Bulk Assign Roles" : "Assign Role"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {mode === "bulk" 
                      ? `Assign roles to ${selectedUsers.length} selected user${selectedUsers.length !== 1 ? 's' : ''}`
                      : `Assign role to ${selectedUsers[0]?.full_name}`
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex h-[70vh]">
              {/* Left Panel - User Selection/Info */}
              <div className="w-1/3 p-6 border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FiUsers className="h-5 w-5 mr-2" />
                  Selected Users ({selectedUsers.length})
                </h3>

                <div className="space-y-3">
                  {selectedUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
                            <FiMail className="h-3 w-3 mr-1" />
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {user.active_roles.length > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {user.active_roles.length} role{user.active_roles.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Current Roles */}
                      {user.active_roles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Current Roles:</p>
                          <div className="flex flex-wrap gap-1">
                            {user.active_roles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 text-xs"
                              >
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Role Selection */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Role *
                    </label>
                    
                    {rolesLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <Controller
                        name="role_id"
                        control={control}
                        rules={{ required: "Please select a role" }}
                        render={({ field }) => (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {effectiveRolesData?.results?.map((role: Role) => (
                              <label
                                key={role.id}
                                className={`
                                  relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                  ${
                                    field.value === role.id
                                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  value={role.id}
                                  checked={field.value === role.id}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  className="sr-only"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <div className={`
                                        w-4 h-4 rounded-full border-2 transition-colors
                                        ${
                                          field.value === role.id
                                            ? "border-indigo-500 bg-indigo-500"
                                            : "border-gray-300 dark:border-gray-600"
                                        }
                                      `}>
                                        {field.value === role.id && (
                                          <div className="w-full h-full rounded-full bg-white scale-50" />
                                        )}
                                      </div>
                                      <h3 className="font-medium text-gray-900 dark:text-white">
                                        {role.name}
                                      </h3>
                                    </div>
                                    {!role.is_active && (
                                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                  
                                  {role.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {role.description}
                                    </p>
                                  )}

                                  {role.permissions && role.permissions.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {role.permissions.slice(0, 3).map((permission) => (
                                        <span
                                          key={permission.id}
                                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                        >
                                          {permission.name}
                                        </span>
                                      ))}
                                      {role.permissions.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                          +{role.permissions.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Show conflicts for selected users */}
                                  {field.value === role.id && selectedUsers.some(user => getUserRoleStatus(user, role.id)) && (
                                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                      <div className="flex items-center space-x-2">
                                        <FiAlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                        <span className="text-xs text-yellow-800 dark:text-yellow-300">
                                          Some users already have this role
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      />
                    )}
                    
                    {errors.role_id && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.role_id.message}
                      </p>
                    )}
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiration Date (Optional)
                    </label>
                    <div className="relative">
                      <Controller
                        name="expires_at"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="datetime-local"
                            {...field}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        )}
                      />
                      <FiCalendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave empty for permanent assignment
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assignment Notes (Optional)
                    </label>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Add any notes about this role assignment..."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        />
                      )}
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting || !watchedRoleId}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <>
                          <FiUserCheck className="h-4 w-4" />
                          <span>Assign Role</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RoleAssignmentModal;