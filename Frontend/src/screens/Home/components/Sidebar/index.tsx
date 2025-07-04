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

  const { user, profileImage } = useAuth();

  const navItems = [
    { path: "/home", icon: <FiHome />, label: "Dashboard" },
    { path: "/home/customers", icon: <RiUserSearchLine />, label: "Customers" },
    {
      path: "/home/loan-applications",
      icon: <FiFileText />,
      label: "Loan Applications",
    },
    { path: "/home/admin", icon: <FiSettings />, label: "Admin Console" },
    { path: "/home/settings", icon: <FiSliders />, label: "Account Settings" },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white shadow-lg"
        >
          <FiMenu className="h-6 w-6" />
        </button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={isMobile ? { x: -300 } : { x: 0 }}
        animate={{
          x: isOpen ? 0 : -300,
          width: isCollapsed && !isMobile ? 80 : 256,
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={`fixed lg:relative z-50 h-screen bg-gradient-to-b from-indigo-900 to-blue-900 text-white shadow-xl ${
          isMobile ? "" : "lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-blue-800">
          {!isCollapsed && <Logo />}
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="text-blue-300 hover:text-white transition-colors"
            >
              <FiChevronLeft
                className={`h-5 w-5 transition-transform ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    location.pathname === item.path
                      ? "bg-blue-700 text-white"
                      : "text-blue-200 hover:bg-blue-800 hover:text-white"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
            <div className="flex items-center p-3 rounded-lg bg-blue-800">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  {profileImage ? (
                    profileImage
                  ) : (
                    <FiUser className="text-white" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-blue-800"></span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-blue-300">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};
export default Sidebar;
