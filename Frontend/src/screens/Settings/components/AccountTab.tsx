import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FiEdit,
  FiLock,
  FiMail,
  FiChevronRight,
  FiEye,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { SettingCard } from "./SettingCard";
import { useAuth } from "../../Authentication/Login-SignUp/components/hooks/useAuth";
import UltraPremiumAccountInfo from "./AccountInfo";

export const AccountTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    user,
    currentUser,
    isAuthenticated,
    userInitials,
    profileImage,
    imageLoaded,
    handleImageError,
    logout,
    isLoggingOut,
    logoutError,
    isAdmin,
    isManager,
  } = useAuth();

  const tapEffect = {
    scale: 0.98,
    transition: { type: "spring", stiffness: 1000, damping: 20 },
  };

  const glowEffect = {
    boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
    transition: { duration: 0.3 },
  };

  const togglePasswordVisibility = (field) => {
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

  // Show loading state if not authenticated
  if (!isAuthenticated) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <SettingCard>
        <motion.div className="flex flex-col md:flex-row items-center md:space-x-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl">
          <motion.div className="relative group mb-4 md:mb-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
              {profileImage && imageLoaded ? (
                <img
                  src={profileImage}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <span className="text-3xl md:text-4xl text-indigo-600 dark:text-indigo-400 font-bold">
                  {userInitials}
                </span>
              )}
            </div>
            <motion.button
              className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 md:p-3 rounded-full shadow-lg transform translate-y-1/4 group-hover:translate-y-0 transition-all"
              whileHover={{ scale: 1.1, ...glowEffect }}
              whileTap={tapEffect}
            >
              <FiEdit size={18} />
            </motion.button>
          </motion.div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center md:justify-start mt-1">
                  <FiMail className="mr-2" />
                  {user.email}
                </p>
                {user.role && (
                  <div className="flex items-center justify-center md:justify-start mt-2">
                    <FiUser className="mr-2 text-purple-600 dark:text-purple-400" />
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                      {user.role}
                    </span>
                  </div>
                )}
              </div>

              <motion.button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-4 md:mt-0 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg flex items-center space-x-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={tapEffect}
              >
                <FiLogOut size={16} />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </motion.button>
            </div>

            {logoutError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg"
              >
                <p className="text-red-800 dark:text-red-300 text-sm">
                  {logoutError}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </SettingCard>

      {/* Account Information */}
      <UltraPremiumAccountInfo
        currentUser={currentUser}
        isAdmin={isAdmin}
        isManager={isManager}
      />

      {/* Password Section */}
      <SettingCard>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FiLock className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Password Security
          </h4>
          <motion.button
            onClick={() => setIsEditing(!isEditing)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
            whileHover={{ x: 3 }}
            whileTap={tapEffect}
          >
            <FiEdit className="mr-1" />
            {isEditing ? "Cancel" : "Edit"}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                {[
                  { label: "Current Password", key: "current" },
                  { label: "New Password", key: "new" },
                  { label: "Confirm New Password", key: "confirm" },
                ].map(({ label, key }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword[key] ? "text" : "password"}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white/80 dark:bg-gray-700/80 dark:text-white"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(key)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  className="flex justify-end space-x-3 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <motion.button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={tapEffect}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.03, ...glowEffect }}
                    whileTap={tapEffect}
                  >
                    Save Changes
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <FiLock className="mr-2 text-indigo-600 dark:text-indigo-400" />
                <span>Last changed 3 months ago</span>
              </div>
              <FiChevronRight className="text-gray-400 dark:text-gray-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </SettingCard>
    </motion.div>
  );
};
