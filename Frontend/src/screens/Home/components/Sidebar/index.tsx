import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiFileText,
  FiAlertTriangle,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiChevronLeft,
  FiMenu,
  FiSliders
} from "react-icons/fi";
import Logo from "../../../../components/utils/Logo";

const Sidebar: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(!isMobile);
  const location = useLocation();

  const navItems = [
    { path: "/home", icon: <FiHome />, label: "Overview" },
    { path: "/home/applications", icon: <FiFileText />, label: "Applications" },
    {
      path: "/home/risk-analysis",
      icon: <FiAlertTriangle />,
      label: "Risk Analysis",
    },
    { path: "/home/explainability", icon: <FiBarChart2 />, label: "Explainability" },
    { path: "/home/admin-panel", icon: <FiSettings />, label: "Admin Panel" },
    {path: "/home/settings", icon: <FiSliders/>, label: "Settings"}
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

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
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={`fixed lg:relative z-50 h-screen bg-gradient-to-b from-indigo-900 to-blue-900 text-white w-64 shadow-xl ${
          isMobile ? "" : "lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-blue-800">
          <Logo />
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="text-blue-300 hover:text-white transition-colors"
            >
              <FiChevronLeft
                className={`h-5 w-5 transition-transform ${
                  isOpen ? "" : "rotate-180"
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
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <div className="flex items-center p-3 rounded-lg bg-blue-800">
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <FiUser className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-blue-800"></span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-blue-300">Administrator</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
