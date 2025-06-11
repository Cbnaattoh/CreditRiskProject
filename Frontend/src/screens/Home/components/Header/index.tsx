import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { FiSearch, FiBell, FiHelpCircle, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const Header: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  // Define page titles based on routes
  const getPageInfo = (pathname: string) => {
    const routeMap: Record<string, { title: string; subtitle: string }> = {
      "/home": { title: "Risk Dashboard", subtitle: "Overview" },
      "/home/applicants": { title: "Risk Dashboard", subtitle: "Applicants" },
      "/home/applications": {
        title: "Risk Dashboard",
        subtitle: "Applications",
      },
      "/home/risk-analysis": {
        title: "Risk Dashboard",
        subtitle: "Risk Analysis",
      },
      "/home/explainability": {
        title: "Risk Dashboard",
        subtitle: "Explainability",
      },
      "/home/admin-panel": { title: "Risk Dashboard", subtitle: "Admin Panel" },
      "/home/settings": { title: "Risk Dashboard", subtitle: "Settings" },
    };

    return (
      routeMap[pathname] || { title: "Risk Dashboard", subtitle: "Overview" }
    );
  };

  const { title, subtitle } = getPageInfo(location.pathname);

  return (
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
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                AU
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-gray-500">admin@riskguard.com</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <FiLogOut className="mr-2" /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
