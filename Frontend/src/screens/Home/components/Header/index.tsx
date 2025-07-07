import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiBell,
  FiHelpCircle,
  FiLogOut,
  FiUser,
  FiCamera,
  FiMoon,
  FiSun,
  FiChevronDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../Authentication/Login-SignUp/components/hooks/useAuth";
import defaultAvatar from "../../../../assets/creditrisklogo.png";
import SignoutModal from "../SignoutModal";
import { useToast, ToastContainer } from "../../../../components/utils/Toast";

const Header: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize toast
  const { showToast, toasts, removeToast } = useToast();

  const {
    user,
    userInitials,
    profileImage,
    profileImageUrl,
    imageLoaded,
    imageError,
    handleImageError,
    logout,
    isLoggingOut,
    logoutError,
  } = useAuth();

  // Handle logout with modal
  const handleLogout = async () => {
    setShowSignoutModal(false);
    await logout();
    setProfileOpen(false);
    showToast("You have been logged out successfully", "success");
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search logic here
      console.log("Searching for:", searchQuery);
    }
  };

  // Define page titles based on routes
  const getPageInfo = (pathname: string) => {
    if (pathname.match(/^\/home\/loan-applications\/[^/]+\/risk/)) {
      return { title: "Risk Dashboard", subtitle: "Risk Analysis", icon: "📊" };
    }

    if (pathname.match(/^\/home\/loan-applications\/[^/]+\/explainability/)) {
      return {
        title: "Risk Dashboard",
        subtitle: "Explainability",
        icon: "🔍",
      };
    }

    const routeMap: Record<
      string,
      { title: string; subtitle: string; icon: string }
    > = {
      "/home": { title: "Risk Dashboard", subtitle: "Overview", icon: "🏠" },
      "/home/customers": {
        title: "Risk Dashboard",
        subtitle: "Customers",
        icon: "👥",
      },
      "/home/loan-applications": {
        title: "Risk Dashboard",
        subtitle: "Loan Applications",
        icon: "📋",
      },
      "/home/admin": {
        title: "Risk Dashboard",
        subtitle: "Admin Console",
        icon: "⚙️",
      },
      "/home/settings": {
        title: "Risk Dashboard",
        subtitle: "Account Settings",
        icon: "🔧",
      },
    };

    return (
      routeMap[pathname] || {
        title: "Risk Dashboard",
        subtitle: "Overview",
        icon: "🏠",
      }
    );
  };

  const { title, subtitle, icon } = getPageInfo(location.pathname);

  // Profile picture component for reusability
  const ProfilePicture = ({ size = "h-10 w-10", showRing = false }) => {
    const sizeClasses = size;
    const ringClasses = showRing
      ? "ring-2 ring-indigo-200 dark:ring-indigo-400/50"
      : "";

    return (
      <div
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center overflow-hidden ${ringClasses} shadow-lg`}
      >
        {profileImage && !imageError ? (
          <img
            src={profileImage}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={() => console.log("Profile image loaded successfully")}
          />
        ) : (
          <span className="text-white font-semibold text-sm">
            {userInitials}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm z-30 relative transition-all duration-300">
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/20 via-transparent to-purple-50/20 dark:from-indigo-900/10 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

        <div className="relative px-6 py-4 flex items-center justify-between">
          {/* Left side - Dynamic Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Dashboard</span>
                  <span className="mx-2">•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {subtitle}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <AnimatePresence>
                {searchOpen && (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                    onSubmit={handleSearch}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Search applications, customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2.5 px-4 pr-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white shadow-lg"
                      autoFocus
                    />
                  </motion.form>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 shadow-sm"
              >
                <FiSearch className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 shadow-sm"
            >
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiSun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiMoon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 shadow-sm"
            >
              <FiBell className="h-5 w-5" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 shadow-sm"
              />
            </motion.button>

            {/* Help */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 shadow-sm"
            >
              <FiHelpCircle className="h-5 w-5" />
            </motion.button>

            {/* Profile dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                <ProfilePicture size="h-8 w-8" />
                <motion.div
                  animate={{ rotate: profileOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl z-50 overflow-hidden"
                  >
                    {/* Profile header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center space-x-4">
                        <ProfilePicture size="h-16 w-16" showRing={true} />
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                          {user.role && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 mt-2">
                              {user.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile actions */}
                    <div className="p-2">
                      <motion.button
                        whileHover={{
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                        }}
                        onClick={() => {
                          navigate("/home/settings");
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center transition-all duration-200"
                      >
                        <FiUser className="mr-3 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="font-medium">Profile Settings</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Manage your account
                          </div>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                        }}
                        onClick={() => {
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center transition-all duration-200"
                      >
                        <FiCamera className="mr-3 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="font-medium">Change Photo</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Update profile picture
                          </div>
                        </div>
                      </motion.button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-2">
                      <motion.button
                        whileHover={{
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                        }}
                        onClick={() => {
                          setProfileOpen(false);
                          setShowSignoutModal(true);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center transition-all duration-200"
                        disabled={isLoggingOut}
                      >
                        <FiLogOut className="mr-3 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {isLoggingOut ? "Signing out..." : "Sign out"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            End your session
                          </div>
                        </div>
                      </motion.button>

                      {logoutError && (
                        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30 mt-2 rounded-b-2xl">
                          {logoutError}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <SignoutModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={handleLogout}
        showSuccessToast={(message) => showToast(message, "info")}
      />
    </>
  );
};

export default Header;
