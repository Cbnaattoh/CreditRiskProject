import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiBell,
  FiHelpCircle,
  FiLogOut,
  FiUser,
  FiCamera,
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
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize toast
  const { showToast, toasts, removeToast } = useToast();

  const {
    user,
    userInitials,
    profileImage,
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

  // Define page titles based on routes
  const getPageInfo = (pathname: string) => {
    if (pathname.match(/^\/home\/loan-applications\/[^/]+\/risk/)) {
      return { title: "Risk Dashboard", subtitle: "Risk Analysis" };
    }

    if (pathname.match(/^\/home\/loan-applications\/[^/]+\/explainability/)) {
      return { title: "Risk Dashboard", subtitle: "Explainability" };
    }

    const routeMap: Record<string, { title: string; subtitle: string }> = {
      "/home": { title: "Risk Dashboard", subtitle: "Overview" },
      "/home/customers": { title: "Risk Dashboard", subtitle: "Customers" },
      "/home/loan-applications": {
        title: "Risk Dashboard",
        subtitle: "Loan Applications",
      },
      "/home/admin": { title: "Risk Dashboard", subtitle: "Admin Console" },
      "/home/settings": {
        title: "Risk Dashboard",
        subtitle: "Account Settings",
      },
    };

    return (
      routeMap[pathname] || {
        title: "Risk Dashboard",
        subtitle: "Overview",
      }
    );
  };

  const { title, subtitle } = getPageInfo(location.pathname);

  return (
    <>
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <header className="bg-white shadow-sm z-30 relative">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left side - Dynamic Breadcrumb */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-600">{subtitle}</span>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <motion.div
                animate={{ width: searchOpen ? 200 : 40 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Search..."
                  className={`py-2 px-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    searchOpen ? "w-full" : "w-0"
                  }`}
                />
              </motion.div>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="absolute right-0 top-0 h-full flex items-center justify-center w-10 text-gray-500 hover:text-indigo-600"
              >
                <FiSearch className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FiBell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Help */}
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FiHelpCircle className="h-5 w-5" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="relative h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <span className="text-indigo-600 font-medium text-sm">
                      {userInitials}
                    </span>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-1 z-50 border border-gray-100 overflow-hidden"
                  >
                    {/* Profile header */}
                    <div className="px-4 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100 flex items-center space-x-4">
                      <div className="relative h-14 w-14 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-indigo-100">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={user.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <img
                              src={defaultAvatar}
                              alt="Default avatar"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <FiUser className="text-indigo-500 absolute inset-0 m-auto" />
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-gray-900 truncate"
                          title={user.name}
                        >
                          {user.name}
                        </p>
                        <p
                          className="text-xs text-gray-500 truncate"
                          title={user.email}
                        >
                          {user.email}
                        </p>
                        {user.role && (
                          <p className="text-xs text-indigo-600 font-medium mt-1">
                            {user.role}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Profile actions */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate("/home/settings");
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                      >
                        <FiUser className="mr-3 text-gray-500" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                      >
                        <FiCamera className="mr-3 text-gray-500" />
                        Change Photo
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowSignoutModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                        disabled={isLoggingOut}
                      >
                        <FiLogOut className="mr-3 text-gray-500" />
                        {isLoggingOut ? "Signing out..." : "Sign out"}
                      </button>
                      {logoutError && (
                        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
                          {logoutError}
                        </div>
                      )}
                    </div>
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
          />
        </div>
      </header>
    </>
  );
};

export default Header;
