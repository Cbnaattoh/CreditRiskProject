import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit,
  FiLock,
  FiMail,
  FiUser,
  FiLogOut,
  FiEye,
  FiEyeOff,
  FiCamera,
  FiSave,
  FiX,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../components/redux/features/auth/authSlice";
import { useAuth } from "../../Authentication/Login-SignUp/components/hooks/useAuth";

export const AccountTab: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const { logout, isLoggingOut, logoutError } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const togglePasswordVisibility = (field: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTypeDisplay = () => {
    if (typeof user?.user_type === 'string') {
      return user.user_type;
    }
    return user?.user_type?.name || user?.user_type_display || 'User';
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your account
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-white/80 via-blue-50/50 to-indigo-50/80 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {getUserInitials()}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border-2 border-indigo-500"
              >
                <FiCamera className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              </motion.button>
            </div>

            {/* User Info */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.full_name || user.name || 'User'}
              </h3>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiMail className="h-4 w-4 mr-2" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center">
                  <FiUser className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
                    {getUserTypeDisplay()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <motion.button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <FiEdit className="h-4 w-4" />
              <span>Edit Profile</span>
            </motion.button>
            
            <motion.button
              onClick={handleLogout}
              disabled={isLoggingOut}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              <FiLogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </motion.button>
          </div>
        </div>

        {logoutError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg"
          >
            <p className="text-red-800 dark:text-red-300 text-sm">
              {logoutError}
            </p>
          </motion.div>
        )}
      </div>

      {/* Profile Edit Form */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden"
          >
            <div className="p-6">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Edit Profile Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  onClick={() => setIsEditingProfile(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  <FiX className="h-4 w-4 mr-2 inline" />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FiSave className="h-4 w-4 mr-2 inline" />
                  Save Changes
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Security */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FiLock className="h-5 w-5 mr-3 text-indigo-600 dark:text-indigo-400" />
              Password Security
            </h4>
            <motion.button
              onClick={() => setIsEditingPassword(!isEditingPassword)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              {isEditingPassword ? 'Cancel' : 'Change Password'}
            </motion.button>
          </div>

          <AnimatePresence>
            {isEditingPassword ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {[
                  { label: "Current Password", key: "current" },
                  { label: "New Password", key: "new" },
                  { label: "Confirm New Password", key: "confirm" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword[key] ? "text" : "password"}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(key)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword[key] ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end space-x-3 pt-4">
                  <motion.button
                    onClick={() => setIsEditingPassword(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Update Password
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiLock className="h-4 w-4 mr-2" />
                  <span>Password last changed 3 months ago</span>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};