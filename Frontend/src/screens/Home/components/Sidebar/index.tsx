import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiFileText,
  FiSettings,
  FiUser,
  FiChevronLeft,
  FiMenu,
  FiSliders,
} from "react-icons/fi";
import { RiUserSearchLine } from "react-icons/ri";
import { useAuth } from "../../../Authentication/Login-SignUp/components/hooks/useAuth";
import Logo from "../../../../components/utils/Logo";

const Sidebar: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const { user, profileImage, userInitials, imageError, handleImageError } =
    useAuth();

  const navItems = [
    {
      path: "/home",
      icon: <FiHome />,
      label: "Dashboard",
      description: "Overview & Analytics",
    },
    {
      path: "/home/customers",
      icon: <RiUserSearchLine />,
      label: "Customers",
      description: "Manage Client Base",
    },
    {
      path: "/home/loan-applications",
      icon: <FiFileText />,
      label: "Loan Applications",
      description: "Review Applications",
    },
    {
      path: "/home/admin",
      icon: <FiSettings />,
      label: "Admin Console",
      description: "System Management",
    },
    {
      path: "/home/settings",
      icon: <FiSliders />,
      label: "Account Settings",
      description: "Personal Preferences",
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Enhanced profile picture component
  const SidebarProfilePicture = () => {
    return (
      <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white/20 dark:ring-gray-700/50 shadow-lg">
        {profileImage && !imageError ? (
          <img
            src={profileImage}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <span className="text-white text-sm font-semibold">
            {userInitials || <FiUser className="text-white" />}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg text-gray-700 dark:text-gray-200 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
        >
          <FiMenu className="h-5 w-5" />
        </motion.button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={isMobile ? { x: -300 } : { x: 0 }}
        animate={{
          x: isOpen ? 0 : -300,
          width: isCollapsed && !isMobile ? 80 : 280,
        }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
        className={`fixed lg:relative z-50 h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl ${
          isMobile ? "" : "lg:translate-x-0"
        }`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Logo />
            </motion.div>
          )}
          {!isMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleCollapse}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
            >
              <FiChevronLeft
                className={`h-4 w-4 transition-transform duration-300 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/home" &&
                  location.pathname.startsWith(item.path));
              return (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`group flex items-center p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <span
                      className={`text-lg flex-shrink-0 z-10 transition-transform duration-200 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {/* Label and description */}
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 z-10"
                      >
                        <span className="font-medium text-sm block">
                          {item.label}
                        </span>
                        <span
                          className={`text-xs opacity-70 ${
                            isActive
                              ? "text-white/80"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {item.description}
                        </span>
                      </motion.div>
                    )}

                    {/* Hover effect */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative p-4 border-t border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50/50 dark:from-gray-800/50 dark:to-indigo-900/20 border border-gray-200/50 dark:border-gray-700/50 hover:from-indigo-50 hover:to-purple-50/50 dark:hover:from-gray-800/70 dark:hover:to-indigo-900/30 transition-all duration-200">
              <div className="relative">
                <SidebarProfilePicture />
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-sm"
                />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.role}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default Sidebar;
