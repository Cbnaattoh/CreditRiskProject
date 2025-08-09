import React, { useState, useEffect } from "react";
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
  FiShield,
  FiCheck,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiZap,
  FiHeart
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../components/redux/features/auth/authSlice";
import { useAuth } from "../../Authentication/Login-SignUp/components/hooks/useAuth";
import SignoutModal from "../../Home/components/SignoutModal";
import { useToast } from "../../../components/utils/Toast";

export const AccountTab: React.FC = () => {
  const { user, profileImage, profileImageUrl, logout, isLoggingOut, logoutError } = useAuth();
  const { showToast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [profileCompleteness, setProfileCompleteness] = useState(85);
  const [lastActivity, setLastActivity] = useState('2 minutes ago');
  const [saveProgress, setSaveProgress] = useState(0);
  const [isAnimatingStats, setIsAnimatingStats] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setIsAnimatingStats(true);
    const timer = setTimeout(() => setIsAnimatingStats(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [user?.profile_picture_url, user?.profile_picture]);

  const togglePasswordVisibility = (field: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleLogout = async () => {
    setShowSignoutModal(false);
    await logout();
    showToast("You have been logged out successfully", "success");
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
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
    return user?.role || 'User';
  };

  const getProfilePictureUrl = () => {
    if (user?.profile_picture_url) {
      return user.profile_picture_url;
    }

    if (user?.profile_picture) {
      if (user.profile_picture.startsWith('http')) {
        return user.profile_picture;
      }
      return user.profile_picture;
    }

    return null;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const shouldShowProfilePicture = () => {
    const profileUrl = getProfilePictureUrl();
    return profileUrl && !imageError;
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
      {/* Enhanced Profile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/30 to-purple-50/40 dark:from-gray-800/95 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-8">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-8">
            {/* Enhanced Profile Picture */}
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl ring-4 ring-white/30 dark:ring-gray-800/30 relative overflow-hidden"
              >
                {shouldShowProfilePicture() ? (
                  <>
                    {/* Profile Picture */}
                    <img
                      src={getProfilePictureUrl()!}
                      alt={`${user.name || 'User'}'s profile`}
                      className="w-full h-full object-cover rounded-3xl relative z-10"
                      onError={handleImageError}
                    />
                    {/* Overlay gradient for better camera button visibility */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20 rounded-3xl z-20"></div>
                  </>
                ) : (
                  <>
                    {/* Fallback to initials */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <span className="text-3xl font-bold text-white relative z-10">
                      {getUserInitials()}
                    </span>
                  </>
                )}

                {/* Pulse animation - only show for initials */}
                {!shouldShowProfilePicture() && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400/30 to-purple-400/30"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>

              {/* Enhanced Camera Button */}
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-2xl shadow-2xl border-3 border-white dark:border-gray-800 group-hover:shadow-indigo-500/50 transition-all duration-300"
                title="Change profile picture"
              >
                <FiCamera className="h-4 w-4 text-white" />
              </motion.button>

              {/* Status Indicator */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg">
                <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Enhanced User Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                  {user.name || 'User'}
                </h3>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl mr-3">
                      <FiMail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100/50 dark:bg-purple-900/30 rounded-xl mr-3">
                      <FiUser className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-800 dark:text-indigo-300 rounded-2xl text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
                      {getUserTypeDisplay()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity & Stats Row */}
              <div className="flex items-center space-x-6 pt-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-400">Last active: {lastActivity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiTrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold">Profile {profileCompleteness}% complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="flex flex-col space-y-4 mt-6 lg:mt-0 lg:items-end">
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-2xl border border-indigo-200/50 dark:border-indigo-700/50 rounded-2xl text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20"
              >
                <div className="p-1.5 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                  <FiEdit className="h-4 w-4" />
                </div>
                <span>Edit Profile</span>
                <motion.div
                  className="w-1 h-1 bg-indigo-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>

              <motion.button
                onClick={() => setShowSignoutModal(true)}
                disabled={isLoggingOut}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white rounded-2xl font-semibold shadow-2xl hover:shadow-3xl hover:shadow-red-500/30 transition-all duration-300 disabled:cursor-not-allowed"
              >
                <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  {isLoggingOut ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <FiLogOut className="h-4 w-4" />
                  )}
                </div>
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </motion.button>
            </div>

            {/* Profile Completeness Bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompleteness}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full"></div>
              </motion.div>
            </motion.div>
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

      {/* Enhanced Profile Edit Form */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/20 to-purple-50/20 dark:from-gray-900/95 dark:via-indigo-900/10 dark:to-purple-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl">
                  <FiEdit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Edit Profile Information
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FiUser className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Full Name</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:shadow-xl"
                      placeholder="Enter your full name"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FiMail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Email Address</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:shadow-xl"
                      placeholder="Enter your email address"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
                  </div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-end space-x-4 mt-8"
              >
                <motion.button
                  onClick={() => setIsEditingProfile(false)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center space-x-3 px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl backdrop-blur-xl"
                >
                  <FiX className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Cancel</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative overflow-hidden flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-2xl hover:shadow-3xl hover:shadow-indigo-500/30 transition-all duration-300"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                  <FiSave className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Save Changes</span>

                  <motion.div
                    className="w-1 h-1 bg-white rounded-full relative z-10"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Password Security */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-red-50/10 to-orange-50/10 dark:from-gray-900/95 dark:via-red-900/5 dark:to-orange-900/5 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full blur-2xl"></div>

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl">
                <FiLock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Password Security
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Keep your account secure with a strong password</p>
              </div>
            </div>
            <motion.button
              onClick={() => setIsEditingPassword(!isEditingPassword)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl text-indigo-700 dark:text-indigo-300 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FiZap className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>{isEditingPassword ? 'Cancel' : 'Change Password'}</span>
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
                  { label: "Current Password", key: "current", icon: FiLock },
                  { label: "New Password", key: "new", icon: FiShield },
                  { label: "Confirm New Password", key: "confirm", icon: FiCheck },
                ].map(({ label, key, icon: Icon }, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Icon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span>{label}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword[key] ? "text" : "password"}
                        className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:shadow-xl"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                      <motion.button
                        type="button"
                        onClick={() => togglePasswordVisibility(key)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword[key] ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                      </motion.button>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/5 to-orange-500/5 pointer-events-none"></div>
                    </div>
                  </motion.div>
                ))}
                <div className="flex justify-end space-x-4 pt-6">
                  <motion.button
                    onClick={() => setIsEditingPassword(false)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl backdrop-blur-xl"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Cancel</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative overflow-hidden flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-2xl hover:shadow-3xl hover:shadow-red-500/30 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                    <FiShield className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">Update Password</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 backdrop-blur-xl rounded-2xl border border-green-200/30 dark:border-green-800/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100/70 dark:bg-green-900/30 rounded-xl">
                    <FiShield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">Password Security Active</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Last changed 3 months ago</p>
                  </div>
                </div>
                <motion.div
                  className="flex items-center space-x-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">Secure</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SignoutModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={handleLogout}
        showSuccessToast={(message) => showToast(message, "info")}
        variant="default"
        size="md"
        showSessionInfo={true}
      />
    </motion.div>
  );
};