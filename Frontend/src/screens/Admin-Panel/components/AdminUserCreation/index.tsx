import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUser,
  FiMail,
  FiShield,
  FiEye,
  FiEyeOff,
  FiSend,
  FiCheck,
  FiAlertCircle,
  FiUserPlus,
  FiInfo,
  FiCopy,
} from "react-icons/fi";
import { useGetUsersFiltersQuery } from "../../../../components/redux/features/api/RBAC/rbacApi";
import { useToast, ToastContainer } from "../../../../components/utils/Toast";

interface Role {
  id: number;
  name: string;
  description: string;
}

interface AdminUserCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (userData: any) => void;
}

// Role to user_type mapping based on backend logic
const ROLE_TO_USER_TYPE_MAPPING: { [key: string]: string } = {
  "Administrator": "ADMIN",
  "Risk Analyst": "ANALYST",
  "Compliance Auditor": "AUDITOR",
  "Client User": "CLIENT",
  "Manager": "ADMIN", // Manager role maps to ADMIN user_type as fallback
};

// User type descriptions for better UX
const USER_TYPE_DESCRIPTIONS: { [key: string]: string } = {
  "ADMIN": "Full system access with administrative privileges and ability to manage all users and system settings",
  "ANALYST": "Specialized access for risk analysis, credit assessment, and financial modeling capabilities",
  "AUDITOR": "Compliance-focused access for auditing activities, regulatory reporting, and compliance monitoring",
  "CLIENT": "Limited access for client users to view their own applications and basic reporting features"
};

// Default roles - these will be loaded from API
const defaultRoles: Role[] = [
  { id: 1, name: "Administrator", description: "Full system access and administration" },
  { id: 2, name: "Risk Analyst", description: "Analyze and assess credit risk for applications" },
  { id: 3, name: "Compliance Auditor", description: "Review compliance and audit activities" },
  { id: 4, name: "Manager", description: "Manage team operations and oversee processes" },
  { id: 5, name: "Client User", description: "Basic client access with limited permissions" },
];

const AdminUserCreation: React.FC<AdminUserCreationProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_id: "",
    user_type: "",
    send_email_notification: true,
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>(defaultRoles);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  // Toast system
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo, toasts, removeToast, clearAllToasts } = useToast();

  // Get roles from RBAC API
  const { data: filtersData, isLoading: isLoadingRoles } = useGetUsersFiltersQuery();

  // Update available roles when RBAC data loads
  useEffect(() => {
    if (filtersData?.roles) {
      const formattedRoles = filtersData.roles.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: getRoleDescription(role.name),
      }));
      setAvailableRoles(formattedRoles);
    }
  }, [filtersData]);

  // Show warning if no roles are available
  useEffect(() => {
    if (!isLoadingRoles && (!filtersData?.roles || filtersData.roles.length === 0)) {
      showWarning("No active roles found. Please ensure roles are properly configured in the system.");
    }
  }, [isLoadingRoles, filtersData, showWarning]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          role_id: "",
          user_type: "",
          send_email_notification: true,
        });
        setSuccess(false);
        setShowTempPassword(false);
        setTempPassword("");
        clearAllToasts();
      }, 300);
    }
  }, [isOpen, clearAllToasts]);

  const getRoleDescription = (roleName: string): string => {
    const descriptions: { [key: string]: string } = {
      "Client User": "Basic client access for viewing personal applications and limited reporting features. Cannot access administrative functions.",
      "Risk Analyst": "Specialized role for credit risk assessment, financial modeling, and risk analysis. Can evaluate applications and generate risk reports.",
      "Compliance Auditor": "Focused on regulatory compliance, audit activities, and compliance monitoring. Access to audit logs and compliance reports.",
      "Manager": "Management role with elevated permissions for team oversight, process management, and departmental reporting capabilities.",
      "Administrator": "Complete system access including user management, system configuration, and all administrative functions.",
    };
    return descriptions[roleName] || "Standard role with specific permission set";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Auto-derive user_type when role changes
    if (name === "role_id" && value) {
      const selectedRole = availableRoles.find(role => role.id.toString() === value);
      const userType = selectedRole ? ROLE_TO_USER_TYPE_MAPPING[selectedRole.name] || "CLIENT" : "";

      setFormData(prev => ({
        ...prev,
        [name]: value,
        user_type: userType,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.role_id || !formData.user_type) {
      showError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/users/admin/create-user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.message || "Failed to create user";

        // Handle specific validation errors
        if (errorData.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          showError(`Validation failed: ${validationErrors}`);
        } else {
          showError(errorMessage);
        }

        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setTempPassword(data.temporary_password);
      setSuccess(true);

      // Show success message with user details before switching to success screen
      const selectedRole = availableRoles.find(role => role.id.toString() === formData.role_id);
      showSuccess(`User "${formData.first_name} ${formData.last_name}" created successfully with ${selectedRole?.name} role!`);

      setTimeout(() => {
        setSuccess(true);
      }, 100);

      // Call success callback
      // if (onUserCreated) {
      //   onUserCreated(data);
      // }

    } catch (err: any) {
      showError(err.message || "Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPasswordToClipboard = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        showInfo("Temporary password copied to clipboard!");
      } catch (err) {
        showError("Failed to copy password to clipboard. Please copy manually.");
      }
    }
  };

  const selectedRole = availableRoles.find(role => role.id.toString() === formData.role_id);

  if (!isOpen) return null;

  return (
    <div className="fixed z-[60]">
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FiUserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New User</h2>
                  <p className="text-indigo-100 mt-1">Add a new team member with role-based access</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <FiX className="h-6 w-6" />
              </motion.button>
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg"
                  >
                    <FiCheck className="h-10 w-10 text-white" />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      User Created Successfully!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      The new user account has been created and configured.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <FiUser className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Account Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-blue-800 dark:text-blue-200">
                              <strong>Name:</strong> {formData.first_name} {formData.last_name}
                            </p>
                            <p className="text-blue-800 dark:text-blue-200">
                              <strong>Email:</strong> {formData.email}
                            </p>
                            <p className="text-blue-800 dark:text-blue-200">
                              <strong>Role:</strong> {selectedRole?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {tempPassword && (
                      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 mb-6">
                        <div className="flex items-start space-x-3">
                          <FiShield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                              Temporary Password
                            </h4>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between">
                                <code className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1 mr-2">
                                  {showTempPassword ? tempPassword : "••••••••••••"}
                                </code>
                                <div className="flex items-center space-x-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={copyPasswordToClipboard}
                                    className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                                    title="Copy to clipboard"
                                  >
                                    <FiCopy className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowTempPassword(!showTempPassword)}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    title={showTempPassword ? "Hide password" : "Show password"}
                                  >
                                    {showTempPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              The user will be required to change this password on their first login.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.send_email_notification && (
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-2xl p-4">
                        <div className="flex items-center space-x-2">
                          <FiSend className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Welcome email sent to {formData.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={()=>{
                      if (onUserCreated && tempPassword){
                        onUserCreated({temporary_password: tempPassword});
                      }
                      onClose();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Done
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                        First Name *
                      </label>
                      <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="John"
                          className="pl-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        />
                      </motion.div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                        Last Name *
                      </label>
                      <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          className="pl-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                      Email Address *
                    </label>
                    <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john.doe@company.com"
                        className="pl-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        required
                      />
                    </motion.div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Role Assignment *
                      </label>
                      <div className="group relative">
                        <FiInfo className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                          <div className="font-semibold mb-1">Role-Based Access Control (RBAC)</div>
                          <div>Each role automatically determines the user's access level and permissions. The system follows industry-standard security practices where roles define what actions a user can perform.</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                        <FiShield className="text-gray-400" />
                      </div>
                      <select
                        name="role_id"
                        value={formData.role_id}
                        onChange={handleInputChange}
                        className="pl-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select a role...</option>
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id} className="bg-white dark:bg-gray-800">
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                    {selectedRole && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700/50"
                      >
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedRole.description}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* User Type Information - Auto-derived from Role */}
                  {formData.user_type && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-xl">
                          <FiShield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            User Access Level: {formData.user_type}
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
                            {USER_TYPE_DESCRIPTIONS[formData.user_type]}
                          </p>
                          <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-300">
                            <FiCheck className="h-3 w-3 mr-1" />
                            <span>Automatically assigned based on selected role</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Email Notification Toggle */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="send_email_notification"
                      id="send_email_notification"
                      checked={formData.send_email_notification}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indigo-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    />
                    <label htmlFor="send_email_notification" className="text-sm text-gray-700 dark:text-gray-300">
                      Send welcome email with login credentials
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 px-6 rounded-2xl font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      Cancel
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className={`flex-1 py-4 px-6 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <motion.svg
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-5 h-5 mr-3"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </motion.svg>
                          Creating User...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <FiUserPlus className="mr-2" />
                          Create User
                        </span>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUserCreation;